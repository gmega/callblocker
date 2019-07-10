import asyncio
import textwrap

import pytest
from django.utils import timezone

from callblocker.blocker.callmonitor import CallMonitor
from callblocker.blocker.models import Caller, Call, Source
from callblocker.blocker.telcos import Vivo
from callblocker.core.modem import Modem
from callblocker.core.tests.fakeserial import CX930xx_fake


@pytest.mark.django_db
def test_register_calls(fake_serial):
    event = fake_serial.load_script(textwrap.dedent(
        """
        RING\n
        \n
        RING\n
        \n
        NMBR = 2111992223451\n
        \n
        RING\n
        \n
        RING\n
        \n
        RING\n
        \n
        NMBR = 2111992223451\n
        \n
        RING\n
        \n
        NMBR = 2111992223452\n
        """
    ), step=0)

    loop = asyncio.get_event_loop()

    modem = Modem(CX930xx_fake, fake_serial, loop)
    monitor = CallMonitor(Vivo(), modem)

    loop.create_task(fake_serial.loop())
    loop.create_task(modem.loop())
    loop.create_task(monitor.loop())

    loop.run_until_complete(event.wait())

    # We need this filter because the sample data loaded by the fixture contains a lot of stuff already.
    reference = {'992223451', '992223452'}

    numbers = {x.number for x in Caller.objects.all() if x.number in reference}
    assert numbers == reference

    events = [event for event in Call.objects.all().order_by('time') if event.caller.number in reference]
    assert [event.caller.number for event in events] == ['992223451', '992223451', '992223452']
    assert not any(event.blocked for event in events)


@pytest.mark.django_db
def test_blocks_calls(fake_serial):
    # Blacklisted number.
    blacklisted = Caller(
        source=Source.predef_source(Source.CID),
        area_code='11',
        number='992345678',
        block=True,
        date_inserted=timezone.now()
    )

    blacklisted.save()

    fake_serial.load_script(textwrap.dedent(
        """
        RING\n
        \n
        NMBR = 2111992345678
        """
    ))

    # We expect the modem to:

    # 1. Hangup
    # 2. Log the call

    # Check that the modem hangs up
    fake_serial.on_input(input='ATH1').reply('OK')
    last = fake_serial.on_input(input='ATH0').reply('OK')

    loop = asyncio.get_event_loop()

    modem = Modem(modem_type=CX930xx_fake, device_factory=fake_serial)
    monitor = CallMonitor(provider=Vivo(), modem=modem)

    loop.create_task(fake_serial.loop())
    loop.create_task(modem.loop())
    loop.create_task(monitor.loop())

    loop.run_until_complete(last.wait())

    # Checks that the call has been logged
    event = Call.objects.get(
        caller=blacklisted
    )

    assert event.blocked
