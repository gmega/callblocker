import asyncio
import logging
import re
from abc import ABC, abstractmethod
from asyncio import Event, StreamWriter, StreamReader
from typing import Union, List, Dict, Tuple, Optional

import serial_asyncio

logger = logging.getLogger(__name__)


class Token(object):
    def __init__(self, token_type: str, contents: Union[None, str]):
        self.token_type = token_type
        self.contents = contents

    def __eq__(self, other):
        if not isinstance(other, Token):
            return False

        return (self.token_type == other.token_type and
                self.contents == other.contents)

    def __hash__(self):
        return (self.token_type + self.contents).__hash__()

    def __repr__(self):
        return 'Token(%s, %s)' % (self.token_type, self.contents)


TOKEN_TYPES = (
    (r'($|[\s]+$)', lambda _: Token('BLANK', None)),
    (r'RING', lambda _: Token('RING', None)),
    (r'OK', lambda _: Token('OK', None)),
    (r'NMBR = ([0-9]+)', lambda match: Token('CALL_ID', match.group(1))),
    (r'AT[\S]+', lambda match: Token('AT_COMMAND', match.group(0))),
    (r'.*', lambda match: Token('UNKNOWN', match.group(0)))
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
        'init': [
            'ATE0',
            'ATZ',
            'AT+VCID=1'
        ],
        'drop_call': [
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
        return await serial_asyncio.open_serial_connection(loop=loop, port=self.port, baudrate=self.baud)


class Modem(object):

    def __init__(self,
                 modem_type: ModemType,
                 device_factory: SerialDeviceFactory,
                 loop: Optional[asyncio.AbstractEventLoop] = None):
        self.device_factory = device_factory
        self.modem_type = modem_type

        self._loop = asyncio.get_event_loop() if loop is None else loop
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
                await asyncio.sleep(1, loop=self._loop)
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
            response = await events.__anext__()

            # Echo is on. Got to read an extra line.
            if response.contents == command:
                response = await events.__anext__()

            if response.token_type != 'OK':
                raise Exception('Bad response while running %s: %s' % (command, response.contents))

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
            self._pending = self._loop.create_future()

        return self._pending

    def _ensure_running(self):
        if not self.running:
            raise Exception('Modem event loop is not running.')

    async def _connect(self) -> None:
        try:
            self._reader, self._writer = await self.device_factory.connect(loop=self._loop)
        except Exception as ex:
            self.close()
            raise ex

    async def _read_event(self, discard=None) -> Union[Token, None]:
        """
        Reads a line from the modem input and analyses it as a :class:`~Token`. The call will return None
         immediately if there is nothing to read. Otherwise, it will attempt to read a complete line from
         the underlying :class:`SerialDevice`.

        Since responses from the modem are terminated with newlines, this means the call should not
        usually block. But hey, modems.

        :param discard:
            does not parse lines matching this string (useful for when echo is on).

        :return: a :class:`~Token`.
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
            if token.token_type != 'BLANK':
                # Returns the first non-blank token.
                return token

    def _match_token(self, line) -> Token:
        for expression, token_type in TOKEN_TYPES:
            match = re.match(expression, line)
            if not match:
                continue
            return token_type(match)

        raise Exception('Unmatched token %s' % line)

    def __enter__(self):
        self._connect()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class EventStream(object):
    def __init__(self, parent: Modem):
        self.parent = parent
        self.has_events = Event()
        self.events = []
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
                yield self.events.pop()
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

    def event_received(self, event: Token):
        self.events.append(event)
        self.has_events.set()

    def exception(self, ex):
        self.ex = ex
        self.has_events.set()
