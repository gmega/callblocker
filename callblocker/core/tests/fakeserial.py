import asyncio
from asyncio import Protocol, StreamReader, Event, Queue

from callblocker.core.modem import ModemType, CX930xx, SerialDeviceFactory

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
        self.done = Event()

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
        self.done = Event()

    def output(self, output: str):
        self.payload = output
        return self

    async def process(self, modem: 'ScriptedModem'):
        await asyncio.sleep(self.timeout)
        modem.out_buffer.feed_data(self.payload.encode(CX930xx_fake.encoding) + CX930xx_fake.newline)
        self.done.set()

    async def wait(self):
        await self.done.wait()


class ScriptedModem(SerialDeviceFactory, Protocol):
    """
    ScriptedModem emulates the behavior of a serial modem by following a pre-programmed script. It expects
    commands to be issued in a certain order. It also supports timed actions (e.g., after 3 seconds, generate
    this command).
    """

    def __init__(self, command_mode=False):
        self.script = None
        self._deferred_actions = []
        self.out_buffer = None
        self.in_buffer = None
        self.closed = False

        self.command_mode = command_mode
        self.aio_loop = None

    # --------------------- Scripting methods ---------------------------------

    def on_input(self, input: str) -> ReplyAction:
        """
        on_input allows scripting of the modem to react in response to a given
        expected input.

        :param input:
        :return:
        """
        reply = ReplyAction(input)
        self._add_action(reply)
        return reply

    def after(self, seconds: int):
        timed = TimedAction(seconds)
        self._add_action(timed)
        return timed

    def load_script(self, lines: str, step: int = 0):
        last = None
        for line in lines.splitlines(keepends=False):
            last = self.after(step).output(line)

        return last

    def _add_action(self, action):
        if self.script is not None:
            self.script.put_nowait(action)
        else:
            self._deferred_actions.append(action)

    # ------------------- SerialDeviceFactory --------------------------------

    async def connect(self, aio_loop):
        self.script = Queue(loop=aio_loop)
        self.in_buffer = StreamReader(loop=aio_loop)
        self.out_buffer = StreamReader(loop=aio_loop)

        # Transfer deferred actions.
        for action in self._deferred_actions:
            self.script.put_nowait(action)

        self._deferred_actions = []

        # This would normally be spawned in healthmonitor, but since this is
        # mocking a lower layer I won't care that much about it.
        asyncio.run_coroutine_threadsafe(self.loop(), loop=aio_loop)

        return self.out_buffer, self

    # ------------------ Fake StreamWriter ------------------------------------

    def write(self, data: bytes):
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
        self.closed = True

    # ------------------- Management methods ----------------------------------

    async def loop(self):
        while not self.closed:
            # If the queue is empty and we're not in command mode,
            # we're done.
            if self.script.empty() and not self.command_mode:
                break

            event = await self.script.get()
            await event.process(self)

        self.out_buffer.feed_eof()
        self.in_buffer.feed_eof()

    # ------------------- Convenience methods ---------------------------------

    @staticmethod
    def from_modem_type(modem_type: ModemType) -> 'ScriptedModem':
        modem = ScriptedModem(command_mode=True)
        for command in modem_type.commands[ModemType.INIT]:
            modem.on_input(command).reply('OK')

        return modem
