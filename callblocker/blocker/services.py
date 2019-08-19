"""
This module contains the service configurations for the various run modes of callblocker. The fundamental distinction
is between server mode (which runs most/all services) and command mode (which run selected services).
"""
import sys
from typing import Optional

from django.conf import settings

from callblocker.blocker import telcos
from callblocker.blocker.callmonitor import CallMonitor
from callblocker.core import modems
from callblocker.core.modem import Modem, PySerialDevice
from callblocker.core.service import AsyncioEventLoop
from callblocker.core.servicegroup import ServiceGroupSpec, ServiceGroup
from callblocker.core.tests.fakeserial import CX930xx_fake, ScriptedModem

#: Server mode services.
server = ServiceGroupSpec(
    aio_loop=lambda _: (
        AsyncioEventLoop()
    ),
    modem=lambda services: (
        Modem(
            modems.get_modem(settings.MODEM_TYPE),
            PySerialDevice(settings.MODEM_DEVICE, settings.MODEM_BAUD),
            services.aio_loop.aio_loop
        )
    ),
    callmonitor=lambda services: (
        CallMonitor(
            telcos.get_telco(settings.MODEM_TELCO_PROVIDER),
            services.modem,
            services.aio_loop.aio_loop
        )
    )
)

#: Fake server mode.
fake_server = ServiceGroupSpec(
    aio_loop=lambda _: (
        AsyncioEventLoop()
    ),
    modem=lambda services: (
        Modem(
            CX930xx_fake,
            ScriptedModem.from_modem_type(CX930xx_fake, services.aio_loop.aio_loop),
            services.aio_loop.aio_loop
        )
    ),
    callmonitor=lambda services: (
        CallMonitor(
            telcos.get_telco(settings.MODEM_TELCO_PROVIDER),
            services.modem,
            services.aio_loop.aio_loop
        )
    )
)

#: Command-mode services.
command = ServiceGroupSpec()

# Global containing the group that gets bootstrapped.
_services: Optional[ServiceGroup] = None


def bootstrap(mode: str):
    global _services
    _services = getattr(sys.modules[__name__], mode).bootstrap()


def services() -> ServiceGroup:
    if _services is None:
        raise Exception('Services have not yet been bootstrapped. Call bootstrap first!')
    return _services
