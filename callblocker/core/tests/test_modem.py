import asyncio
import textwrap

from callblocker.core.modem import ModemEvent, Modem, EventStream
from callblocker.core.service import ServiceState
from callblocker.core.tests.fakeserial import CX930xx_fake


def consume(stream: EventStream, n=float('Inf')):
    async def collect():
        events = []
        with stream as mstream:
            try:
                # Because enumerate doesn't work with asynchronous generators
                # (e.g. https://lists.gt.net/python/python/1290077?do=post_view_threaded). :-(
                i = 0
                async for event in mstream:
                    if i > n:
                        break
                    i = i + 1
                    events.append(event)
            except EOFError:
                pass
        return events

    return collect


def test_parses_events(fake_serial, aio_loop):
    assert_parses_to(
        """
    
        RING

        NMBR = 111992659393

        RING
        """,
        [
            ModemEvent('RING', None),
            ModemEvent('CALL_ID', '111992659393'),
            ModemEvent('RING', None)
        ],
        fake_serial,
        aio_loop
    )


def test_sync_command(fake_serial, aio_loop):
    fake_serial.on_input('ATZ').reply('OK')
    fake_serial.on_input('AT+VCID=1').reply('OK')

    modem = Modem(modem_type=CX930xx_fake, device_factory=fake_serial, aio_loop_service=aio_loop)
    modem.sync_start()
    fake_serial.run_scripted_actions()

    asyncio.run_coroutine_threadsafe(modem.sync_command('ATZ'), loop=aio_loop.aio_loop).result()
    asyncio.run_coroutine_threadsafe(modem.sync_command('AT+VCID=1'), loop=aio_loop.aio_loop).result()
    status = modem.status()
    assert status.state == ServiceState.ERRORED
    assert isinstance(status.exception, EOFError)


def tests_works_with_null_characters(fake_serial, aio_loop):
    # Caller ID strings sometimes contain garbage characters. These showed up at my phone.
    assert_parses_to(
        b"""
    
        RING
    
        NMBR = \x7f\x000551142301007
    
        RING
        """.decode('ASCII'),
        [
            ModemEvent('RING', None),
            ModemEvent('CALL_ID', '0551142301007'),
            ModemEvent('RING', None)
        ],
        fake_serial,
        aio_loop
    )


def assert_parses_to(stream, expected, fake_serial, aio_loop):
    fake_serial.after(seconds=0).output(textwrap.dedent(stream))

    modem = Modem(modem_type=CX930xx_fake, device_factory=fake_serial, aio_loop_service=aio_loop)
    stream = modem.event_stream()

    # First starts the modem, then the unblocks the script.
    modem.sync_start()
    fake_serial.run_scripted_actions()

    try:
        actual = asyncio.run_coroutine_threadsafe(consume(stream)(), loop=aio_loop.aio_loop).result()
        assert actual == expected
    finally:
        status = modem.status()
        assert status.state == ServiceState.ERRORED
        assert isinstance(status.exception, EOFError)
