import asyncio
import textwrap

from callblocker.core.modem import ModemEvent, Modem
from callblocker.core.service import ServiceState
from callblocker.core.tests.fakeserial import CX930xx_fake


def test_parses_events(fake_serial, aio_loop):
    fake_serial.after(seconds=0).output(textwrap.dedent("""
    
    RING

    NMBR = 111992659393

    RING
    """))

    expected = [
        ModemEvent('RING', None),
        ModemEvent('CALL_ID', '111992659393'),
        ModemEvent('RING', None)
    ]

    loop = aio_loop.aio_loop
    modem = Modem(modem_type=CX930xx_fake, device_factory=fake_serial, aio_loop=loop)
    stream = modem.event_stream()

    async def collect():
        events = []
        with stream as mstream:
            try:
                async for event in mstream:
                    events.append(event)
            except EOFError:
                pass
        return events

    try:
        modem.sync_start()
        actual = asyncio.run_coroutine_threadsafe(collect(), loop=loop).result()
        assert actual == expected
    finally:
        status = modem.status()
        assert status.state == ServiceState.ERRORED
        assert isinstance(status.exception, EOFError)


def test_sync_command(fake_serial, aio_loop):
    fake_serial.on_input('ATZ').reply('OK')
    fake_serial.on_input('AT+VCID=1').reply('OK')

    loop = aio_loop.aio_loop
    modem = Modem(modem_type=CX930xx_fake, device_factory=fake_serial, aio_loop=loop)
    modem.sync_start()
    asyncio.run_coroutine_threadsafe(modem.sync_command('ATZ'), loop=loop).result()
    asyncio.run_coroutine_threadsafe(modem.sync_command('AT+VCID=1'), loop=loop).result()
    status = modem.status()
    assert status.state == ServiceState.ERRORED
    assert isinstance(status.exception, EOFError)
