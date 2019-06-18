import asyncio

from callblocker.blocker.modem import Token, CX930xx, Modem
from callblocker.blocker.tests.fakeserial import CX930xx_fake
from callblocker.blocker.tests.utils import read_data


def test_parses_events(fake_serial):
    loop = asyncio.get_event_loop()
    fake_serial.after(seconds=0).output(read_data('call.txt').decode('ASCII'))

    expected = [
        Token('RING', None),
        Token('CALL_ID', '111992659393'),
        Token('RING', None)
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
