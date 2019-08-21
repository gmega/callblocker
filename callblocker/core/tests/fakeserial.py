import asyncio
from asyncio import Protocol, StreamReader, Event, Queue, AbstractEventLoop
from threading import Thread

from callblocker.core.modem import ModemType, SerialDeviceFactory
from callblocker.core.modems import CX930xx
from callblocker.core.service import AsyncioService, ServiceState, AsyncioEventLoop

CX930xx_fake = ModemType(
    # We are forced by https://bugs.python.org/issue17083 to create a different modem type that uses
    # '\n' as a line separator for use in our simulations.
    newline=b'\n',
    encoding=CX930xx.encoding,
    command_timeout=CX930xx.command_timeout,
    commands=CX930xx.commands
)


class ReplyAction(object):
    def __init__(self, input: str, timeout: int = 10):
        self.output = None
        self.input = input
        self.timeout = timeout
        self.latency = 0
        self.done = None

    def set_loop(self, aio_loop: AbstractEventLoop):
        self.done = Event(loop=aio_loop)

    def reply(self, output: str) -> 'ReplyAction':
        self.output = output
        return self

    def latency(self, latency: int) -> 'ReplyAction':
        self.latency = latency
        return self

    async def process(self, modem: 'ScriptedModem'):
        line = (await modem.in_buffer.readline()).decode(CX930xx_fake.encoding)
        if self.latency:
            await asyncio.sleep(self.latency)
        if line.strip() != self.input:
            raise Exception('Unexpected input. actual: %s; expected: %s' % (input, self.input))
        modem.out_buffer.feed_data(self.output.encode(CX930xx_fake.encoding) + CX930xx_fake.newline)
        self.done.set()

    async def wait(self):
        await self.done.wait()


class TimedAction(object):
    def __init__(self, timeout: int):
        self.timeout = timeout
        self.payload = None
        self.done = None

    def set_loop(self, aio_loop: AbstractEventLoop):
        self.done = Event(loop=aio_loop)

    def output(self, output: str):
        self.payload = output
        return self

    async def process(self, modem: 'ScriptedModem'):
        await asyncio.sleep(self.timeout)
        modem.out_buffer.feed_data(self.payload.encode(CX930xx_fake.encoding) + CX930xx_fake.newline)
        self.done.set()

    async def wait(self):
        await self.done.wait()


class ScriptedModem(SerialDeviceFactory, Protocol, AsyncioService):
    """
    ScriptedModem emulates the behavior of a serial modem by following a pre-programmed script. It expects
    commands to be issued in a certain order. It also supports timed actions (e.g., after 3 seconds, generate
    this command).
    """

    name = 'fake modem'

    def __init__(self, aio_loop_service: AsyncioEventLoop, command_mode=False, defer_script=False):
        AsyncioService.__init__(self, aio_loop_service)
        self.script = None
        self._deferred_actions = []
        self.out_buffer = None
        self.in_buffer = None

        self.command_mode = command_mode

        self.defer_script = defer_script
        self._defer_event = None

    # --------------------- Scripting methods ---------------------------------

    def on_input(self, input: str) -> ReplyAction:
        """
        on_input allows scripting of the modem to react in response to a given
        expected input.

        :param input:
        :return:
        """
        self._allow_states(*ServiceState.halted_states())
        reply = ReplyAction(input)
        self._add_action(reply)
        return reply

    def after(self, seconds: int):
        self._allow_states(*ServiceState.halted_states())
        timed = TimedAction(seconds)
        self._add_action(timed)
        return timed

    def load_script(self, lines: str, step: int = 0):
        self._allow_states(*ServiceState.halted_states())
        last = None
        for line in lines.splitlines(keepends=False):
            last = self.after(step).output(line)

        return last

    def run_scripted_actions(self):
        """
        Begins running the scripted actions (or enters command mode).
        :return:
        """
        if self._defer_event:
            self.aio_loop.call_soon_threadsafe(self._defer_event.set)

    def _add_action(self, action):
        if not self._add_action_now(action):
            self._deferred_actions.append(action)

    def _add_action_now(self, action):
        if self.script is not None:
            action.set_loop(self.aio_loop)
            self.script.put_nowait(action)
            return True

        return False

    # ------------------- SerialDeviceFactory --------------------------------

    async def connect(self, aio_loop):
        self._allow_states(*ServiceState.halted_states())

        self.script = Queue(loop=aio_loop)
        self.in_buffer = StreamReader(loop=aio_loop)
        self.out_buffer = StreamReader(loop=aio_loop)

        # Transfer deferred actions.
        for action in self._deferred_actions:
            self._add_action_now(action)

        self._deferred_actions = []

        # If the client wishes to delay startup of the scripted actions (e.g. to register an EventStream first),
        # we set this up here.
        if self.defer_script:
            self._defer_event = Event(loop=aio_loop)

        # We're inside of an asyncio task, but need a synchronous start. Hack up
        # an asyncio version of it.
        started = Event(loop=aio_loop)

        def async_start():
            self.sync_start()
            self.aio_loop.call_soon_threadsafe(started.set)

        Thread(target=async_start).start()

        await started.wait()

        return self.out_buffer, self

    # ------------------ Fake StreamWriter ------------------------------------

    def write(self, data: bytes):
        self._allow_states(ServiceState.READY)

        if self.command_mode and self._try_command(data):
            return

        self.in_buffer.feed_data(data)

    def _try_command(self, data: bytes):
        tokens = data. \
            decode(CX930xx_fake.encoding). \
            split(' ', maxsplit=1)

        command = tokens[0]
        payload = None if len(tokens) == 1 else tokens[1].encode(CX930xx_fake.encoding)

        # Echoes to output.
        if command == 'ATECHO' and payload:
            self.out_buffer.feed_data(payload)
            return True

        return False

    async def drain(self):
        # Simulates a slow write.
        await asyncio.sleep(0.1)

    @property
    def transport(self):
        return self

    def close(self):
        self.stop()

    # ------------------- Management methods ----------------------------------

    async def _event_loop(self):
        self._signal_started()
        # Defers running the script if so requested by the user.
        if self._defer_event:
            await self._defer_event.wait()
        # If the queue is empty and we're not in command mode,
        # we're done.
        while (not self.script.empty()) or self.command_mode:
            event = await self.script.get()
            await event.process(self)

    def _graceful_cleanup(self):
        self.out_buffer.feed_eof()
        self.in_buffer.feed_eof()

    # ------------------- Convenience methods ---------------------------------

    @staticmethod
    def from_modem_type(modem_type: ModemType, aio_loop_service: AsyncioEventLoop) -> 'ScriptedModem':
        modem = ScriptedModem(aio_loop_service=aio_loop_service, command_mode=True)
        for command in modem_type.commands[ModemType.INIT]:
            modem.on_input(command).reply('OK')

        return modem
