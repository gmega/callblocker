import logging

from django.conf import settings

from callblocker.blocker import telcos, BOOTSTRAP_CALLMONITOR
from callblocker.blocker.callmonitor import CallMonitor
from callblocker.core import modems, serviceregistry
from callblocker.core.modem import Modem, PySerialDevice
from callblocker.core.service import AsyncioEventLoop
from callblocker.core.tests.fakeserial import ScriptedModem, CX930xx_fake

logger = logging.getLogger(__name__)


def bootstrap():
    # This is an ugly hack. We need to start the modem monitoring loop when we run
    # the Callblocker server, but we do not need to do that when running, say "loaddata" (i.e.
    # it's weird to have loaddata fail because the modem is not attached to the server!).
    # Since Django does not provide us with a sane way of running initialization code, however, the
    # modem monitoring loop is currently initialized from a hardwired call inside of "urls.py", which was the
    # only way I could get this darn thing working (and it's the method of choice for Django users, e.g.
    # https://stackoverflow.com/questions/6791911/execute-code-when-django-starts-once-only). Note
    # that AppConfig#ready, the hook Django provides, is called too early as we need access to model classes; i.e.,
    # putting the code there results in an exception.
    # The simplest solution is therefore to put a flag here which, when set to False, modifies the behavior of the
    # bootstrap module and disables modem monitoring. Ugh.
    if not BOOTSTRAP_CALLMONITOR:
        return

    registry = serviceregistry.registry()

    loop = registry.register_service(AsyncioEventLoop())
    loop.start()

    modem = registry.register_service(_modem_from_settings(loop))
    modem.start()

    callmonitor = CallMonitor(telcos.get_telco(settings.MODEM_TELCO_PROVIDER), modem, loop.aio_loop)
    callmonitor.start()


def _modem_from_settings(loop: AsyncioEventLoop) -> Modem:
    if settings.MODEM_USE_FAKE:
        logger.warn('*** You are using a SIMULATED modem (MODEM_USE_FAKE = True)! Make sure that is what you want.')
        return Modem(
            CX930xx_fake,
            ScriptedModem.from_modem_type(CX930xx_fake, loop.aio_loop),
            loop.aio_loop
        )

    logging.info('**** Bootstrapping SERIAL modem at %s' % settings.MODEM_DEVICE)
    return Modem(
        modems.get_modem(settings.MODEM_TYPE),
        PySerialDevice(settings.MODEM_DEVICE, settings.MODEM_BAUD),
        loop.aio_loop
    )


def _bootstrap(_):
    pass
