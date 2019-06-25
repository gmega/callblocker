import asyncio
import time
from asyncio import Protocol, StreamReader, Event

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

    async def process(self, modem: 'FakeSerial'):
        line = (await modem.in_buffer.readline()).decode(CX930xx_fake.encoding)
        if self.latency:
            time.sleep(self.latency)
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

    async def process(self, modem: 'FakeSerial'):
        await asyncio.sleep(self.timeout)
        modem.out_buffer.feed_data(self.payload.encode(CX930xx_fake.encoding) + CX930xx_fake.newline)
        self.done.set()

    async def wait(self):
        await self.done.wait()


class FakeSerial(SerialDeviceFactory, Protocol):
    """
    FakeSerial is a contraption which emulates the behavior of a serial modem receiving commands and replying
    with data, as well as spontaneously generating data. Much like a :class:`serial.Serial`.
    """

    def __init__(self):
        self._script = []
        self.out_buffer = StreamReader()
        self.in_buffer = StreamReader()
        self.closed = False

    # --------------------- Scripting methods ---------------------------------

    def on_input(self, input: str) -> ReplyAction:
        """
        on_input allows scripting of the modem to react in response to a given
        expected input.

        :param input:
        :return:
        """
        reply = ReplyAction(input)
        self._script.append(reply)
        return reply

    def after(self, seconds: int):
        timed = TimedAction(seconds)
        self._script.append(timed)
        return timed

    def script(self, lines: str, step: int = 0):
        last = None
        for line in lines.splitlines(keepends=False):
            last = self.after(step).output(line)

        return last

    # ------------------- SerialDeviceFactory --------------------------------

    async def connect(self, loop):
        return self.out_buffer, self

    # ------------------ Fake StreamWriter ------------------------------------

    def write(self, data: bytes):
        self.in_buffer.feed_data(data)

    async def drain(self):
        # Simulates a slow write.
        await asyncio.sleep(0.1)

    @property
    def transport(self):
        return self

    def close(self):
        pass

    # ------------------- Management methods ----------------------------------

    async def loop(self):
        while not self.closed and self._script:
            event = self._script.pop(0)
            await event.process(self)

        self.out_buffer.feed_eof()
        self.in_buffer.feed_eof()
