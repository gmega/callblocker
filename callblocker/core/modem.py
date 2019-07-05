import asyncio
import logging
import re
from abc import ABC, abstractmethod
from asyncio import Event, StreamWriter, StreamReader, AbstractEventLoop
from collections import deque
from threading import Thread
from typing import Union, List, Dict, Tuple, Optional

import serial_asyncio

from callblocker.core.healthmonitor import HealthMonitor

logger = logging.getLogger(__name__)


class ModemException(Exception):
    pass


class ModemEvent(object):
    def __init__(self, event_type: str, contents: Optional[str]):
        self.event_type = event_type
        self.contents = contents

    def __eq__(self, other):
        if not isinstance(other, ModemEvent):
            return False

        return (self.event_type == other.event_type and
                self.contents == other.contents)

    def __hash__(self):
        return (self.event_type + self.contents).__hash__()

    def __repr__(self):
        return 'ModemEvent(%s, %s)' % (self.event_type, self.contents)


TOKEN_TYPES = (
    (r'($|[\s]+$)', lambda _: ModemEvent('BLANK', None)),
    (r'RING', lambda _: ModemEvent('RING', None)),
    (r'OK', lambda _: ModemEvent('OK', None)),
    (r'NMBR = ([0-9]+)', lambda match: ModemEvent('CALL_ID', match.group(1))),
    (r'AT[\S]+', lambda match: ModemEvent('AT_COMMAND', match.group(0))),
    (r'.*', lambda match: ModemEvent('UNKNOWN', match.group(0)))
)


class ModemType(object):
    INIT = 'init'
    DROP_CALL = 'drop_call'

    COMMANDS = {INIT, DROP_CALL}

    def __init__(self, encoding: str, newline: bytes, command_timeout: int, commands: Dict[str, List[str]]):
        self.command_timeout = command_timeout
        for command in self.COMMANDS:
            if command not in commands:
                raise Exception('Modem must define sequence for command %s' % command)
        self.commands = commands
        self.encoding = encoding
        self.newline = newline


CX930xx = ModemType(
    encoding='ASCII',
    newline=b'\r',
    command_timeout=2,
    commands={
        ModemType.INIT: [
            'ATE0',
            'ATZ',
            'AT+VCID=1'
        ],
        ModemType.DROP_CALL: [
            'ATH1',
            '#PAUSE',
            '#PAUSE',
            'ATH0'
        ]
    }
)


class SerialDeviceFactory(ABC):
    @abstractmethod
    async def connect(self, loop) -> Tuple[asyncio.StreamReader, asyncio.StreamWriter]:
        pass


class PySerialDevice(SerialDeviceFactory):
    def __init__(self, port, baud):
        self.port = port
        self.baud = baud

    async def connect(self, loop):
        return await serial_asyncio.open_serial_connection(loop=loop, url=self.port, baudrate=self.baud)


class Modem(object):

    def __init__(self,
                 modem_type: ModemType,
                 device_factory: SerialDeviceFactory,
                 loop: Optional[asyncio.AbstractEventLoop] = None):
        self.device_factory = device_factory
        self.modem_type = modem_type

        self.aio_loop = asyncio.get_event_loop() if loop is None else loop
        self._reader: Optional[StreamReader] = None
        self._writer: Optional[StreamWriter] = None
        self.streams = []
        self.running = False

    def close(self):
        if not self.running:
            return

        # FIXME Not sure this will work as intended. I'm hoping this will cause an exception
        # at any blocked readers/writers to the serial device, but that may not be what happens.
        self._writer.transport.close()

        self._reader = self._writer = None
        self.running = False

    async def run_command_set(self, command_set: str):
        self._ensure_running()

        for command in self.modem_type.commands[command_set]:
            # Again, somewhat crude parsing of special commands.
            if command == '#PAUSE':
                await asyncio.sleep(1, loop=self.aio_loop)
                continue

            await self.sync_command(command)

    async def sync_command(self, command: str) -> None:
        """ Sends a command to the modem and expects an answer. If the answer is not OK, throws an error.

        Note that this is a rather limited implementation, and may get confused if the modem replies to
        some other asynchronous event in the meantime. The use case here is lockstep modem initialization
        (send one command at a time), and the call may fail spuriously if, say, a 'RING' message appears
        in the data buffer while we are sending an initialization command. In these cases, retrying
        usually does the trick.

        :param command: A modem command string (e.g. 'ATZ')
        """
        self._ensure_running()

        with self.event_stream() as stream:
            await self.async_command(command)

            events = stream.__aiter__()
            response = await asyncio.wait_for(events.__anext__(), timeout=self.modem_type.command_timeout)

            # Echo is on. Got to read an extra line.
            if response.contents == command:
                response = await asyncio.wait_for(events.__anext__(), timeout=self.modem_type.command_timeout)

            if response.event_type != 'OK':
                raise ModemException('Bad response while running %s: %s' % (command, response.contents))

    async def async_command(self, command: str) -> None:
        """ Asynchronously sends a command to the modem, returning without waiting for
        a reply.

        :param command: A modem command string (e.g. 'ATZ').
        """
        self._ensure_running()

        # This is the right way to write to an asyncio stream
        # (https://docs.python.org/3/library/asyncio-stream.html#asyncio.StreamWriter.drain)
        self._writer.write(command.encode(self.modem_type.encoding) + self.modem_type.newline)
        await self._writer.drain()

        logger.info('Command: %s' % command)

    def event_stream(self) -> 'EventStream':
        stream = EventStream(self)
        self.streams.append(stream)
        return stream

    async def loop(self):
        await self._connect()
        self.running = True
        while self.running:
            try:
                event = await self._read_event()
            except Exception as ex:
                # We have an exception. Tell it to waiting clients, if any.
                for stream in self.streams:
                    stream.exception(ex)

                # Terminate loop and closes. Any operations from here on
                # will result in exceptions.
                self.close()
                break
            else:
                # We have an event. Tell it to waiting clients, if any.
                for stream in self.streams:
                    stream.event_received(event)

    def _next_event(self):
        self._ensure_running()

        if self._pending is None:
            self._pending = self.aio_loop.create_future()

        return self._pending

    def _ensure_running(self):
        if not self.running:
            raise Exception('Modem event loop is not running.')

    async def _connect(self) -> None:
        try:
            self._reader, self._writer = await self.device_factory.connect(loop=self.aio_loop)
        except Exception as ex:
            self.close()
            raise ex

    async def _read_event(self, discard=None) -> Union[ModemEvent, None]:
        """
        Reads a line from the modem input and analyses it as a :class:`~ModemEvent`. The call will return None
         immediately if there is nothing to read. Otherwise, it will attempt to read a complete line from
         the underlying :class:`SerialDevice`.

        Since responses from the modem are terminated with newlines, this means the call should not
        usually block. But hey, modems.

        :param discard:
            does not parse lines matching this string (useful for when echo is on).

        :return: a :class:`~ModemEvent`.
        :raise StopIteration: if there is nothing to read.
        """
        # We have a crude, hardwired tokenizer here. If needed, this can become as
        # complicated as it gets.
        while True:
            line = (await self._reader.readline()).decode(self.modem_type.encoding)

            # According to https://docs.python.org/3.4/library/asyncio-stream.html#asyncio.StreamReader.readline,
            # an empty bytes object means we hit EOF.
            if line == '':
                raise EOFError('Received EOF from serial device.')

            line = line.strip()
            logger.info('Modem: %s' % line)
            if discard and discard == line:
                continue
            token = self._match_token(line)
            if token.event_type != 'BLANK':
                # Returns the first non-blank token.
                return token

    def _match_token(self, line) -> ModemEvent:
        for expression, token_type in TOKEN_TYPES:
            match = re.match(expression, line)
            if not match:
                continue
            return token_type(match)

        # Client is not expected to recover from this.
        raise Exception('Unmatched token %s' % line)

    def __enter__(self):
        self._connect()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class EventStream(object):
    def __init__(self, parent: Modem):
        self.parent = parent
        self.has_events = Event(loop=parent.aio_loop)
        self.events = deque()
        self._aiter = self._stream()
        self.ex = None

    def __aiter__(self):
        return self._aiter

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        self.ex = StopIteration()
        self.parent.streams.remove(self)

    async def _stream(self):
        while True:
            # Returns events if there are any to return.
            if self.events:
                yield self.events.popleft()
                continue

            # No events to return.

            # If an exception has been set, it means we
            # aren't getting more events. Bubbles it up to
            # the client.
            if self.ex:
                raise self.ex

            # If the parent is no longer running, we aren't
            # getting more events. Breaks.
            if not self.parent.running:
                break

            # Otherwise awaits for more events or an exception.
            self.has_events.clear()
            await self.has_events.wait()

    def event_received(self, event: ModemEvent):
        self.events.append(event)
        self.has_events.set()

    def exception(self, ex):
        self.ex = ex
        self.has_events.set()


def bootstrap_modem(modem: Modem, supervisor: HealthMonitor) -> Tuple[AbstractEventLoop, Thread]:
    """
    Utility method for bootstrapping the modem's event loop to run in a separate thread
    and with :class:`TaskMonitor` monitoring and initializing the modem. This somewhat
    ad hoc procedure is done here because it is required in multiple places.

    :param modem: The :class:`Modem` instance to bootstrap.
    :param supervisor: a :class:`TaskMonitor` instance which will supervise threads
        and coroutines.

    :return: a tuple containing the newly-created :class:`AbstractEventLoop`and the
            :class:`Thread` it is running in.
    """
    # Starts the asyncio loop.
    aio_loop = asyncio.new_event_loop()
    loop_thread = supervisor.thread('asyncio event loop', target=aio_loop.run_forever, daemon=True)
    loop_thread.start()

    # Starts the monitoring loops.
    modem.aio_loop = aio_loop
    supervisor.run_coroutine_threadsafe(modem.loop(), 'modem event loop', aio_loop)

    # Synchronously initializes the modem.
    asyncio.run_coroutine_threadsafe(modem.run_command_set(ModemType.INIT), loop=aio_loop).result()

    return aio_loop, loop_thread
