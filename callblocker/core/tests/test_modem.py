import asyncio
import textwrap

from callblocker.core.modem import ModemEvent, Modem
from callblocker.core.tests.fakeserial import CX930xx_fake


def test_parses_events(fake_serial):
    fake_serial.after(seconds=0).output(textwrap.dedent("""
    
    RING

    NMBR = 111992659393

    RING
    """))

    loop = asyncio.get_event_loop()
    expected = [
        ModemEvent('RING', None),
        ModemEvent('CALL_ID', '111992659393'),
        ModemEvent('RING', None)
    ]

    modem = Modem(modem_type=CX930xx_fake, device_factory=fake_serial, loop=loop)

    async def collect():
        events = []
        with modem.event_stream() as stream:
            try:
                async for event in stream:
                    events.append(event)
            except EOFError:
                pass
        return events

    loop.create_task(fake_serial.loop())
    loop.create_task(modem.loop())
    actual = loop.run_until_complete(collect())

    assert actual == expected


def test_sync_command(fake_serial):
    loop = asyncio.get_event_loop()

    fake_serial.on_input('ATZ').reply('OK')
    fake_serial.on_input('AT+VCID=1').reply('OK')

    modem = Modem(modem_type=CX930xx_fake, device_factory=fake_serial, loop=loop)
    loop.create_task(fake_serial.loop())
    loop.create_task(modem.loop())

    try:
        loop.run_until_complete(modem.sync_command('ATZ'))
        loop.run_until_complete(modem.sync_command('AT+VCID=1'))
    finally:
        modem.close()