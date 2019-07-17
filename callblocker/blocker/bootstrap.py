import logging
from typing import Optional

from django.conf import settings

from callblocker.blocker import BOOTSTRAP_CALLMONITOR
from callblocker.blocker.callmonitor import CallMonitor
from callblocker.blocker.telcos import Vivo
from callblocker.core import healthmonitor
from callblocker.core.modem import Modem, CX930xx, PySerialDevice, bootstrap_modem
from callblocker.core.tests.fakeserial import ScriptedModem, CX930xx_fake

# This is an ugly hack. We need to start the modem monitoring loop when we run
# the Callblocker server, but we do not need to do that when running, say "loaddata" (i.e.
# it's weird to have loaddata fail because the modem is not attached to the server!).
# Since Django does not provide us with a sane way of running initialization code, however, the
# modem monitoring loop is currently initialized from a hardwired call inside of "urls.py", which was the
# only way I could get this darn thing working (and it's the method of choice for Django users, e.g.
# https://stackoverflow.com/questions/6791911/execute-code-when-django-starts-once-only). Note
# that AppConfig#ready, the hook Django provides, is called too early as we need access to model classes; i.e.,
# putting the code there results in an exception.
# The solution is therefore to put a flag here which, when set to False, modifies the behavior of the
# bootstrap module and disables modem monitoring. Ugh.

logger = logging.getLogger(__name__)

_modem = None
_callmonitor = None


def bootstrap_callmonitor(modem: Optional[Modem] = None) -> CallMonitor:
    """
    Initializes and returns the global :class:`CallMonitor` instance. :func:`bootstrap_callmonitor` will take care
    of initializing an asyncio loop in a separate thread and scheduling their event loops with :class:`HealthMonitor`.
    After successful initialization, subsequent calls to this method will return the same instance of
    :class:`CallMonitor`.

    :param modem:
        a preconfigured :class:`Modem`, or None if the modem is to be created from settings.

    :return: a running :class:`CallMonitor`.
    """
    return _bootstrap(modem)


def bootstrap_callmonitor_noexc(modem: Optional[Modem] = None) -> Optional[CallMonitor]:
    """
    Convenience version of :func:`bootstrap_callmonitor` which logs any eventual exceptions and then
    swallows them.

    :param modem:
        a preconfigured :class:`Modem`, or None if the modem is to be created from settings.

    :return: a running :class:`CallMonitor`.
    """
    try:
        return bootstrap_callmonitor(modem)
    except:
        logger.exception('Failed to bootstrap the call monitor.')


def modem() -> Modem:
    if _modem is None:
        raise Exception('The call monitor has not been bootstrapped.')

    return _modem


def callmonitor() -> CallMonitor:
    if _callmonitor is None:
        raise Exception('The call monitor has not been bootstrapped.')

    return _callmonitor


if BOOTSTRAP_CALLMONITOR:

    def _bootstrap(modem: Optional[Modem] = None) -> CallMonitor:
        global _callmonitor, _modem

        supervisor = healthmonitor.monitor()
        modem = modem if modem is not None else _modem_from_settings()

        aio_loop, _ = bootstrap_modem(modem, supervisor)

        callmonitor = CallMonitor(Vivo(), modem)
        supervisor.run_coroutine_threadsafe(callmonitor.loop(), 'call monitor event loop', aio_loop)

        # If everything worked out okay...
        _modem = modem
        _callmonitor = callmonitor

        return _callmonitor


    def _modem_from_settings() -> Modem:
        if settings.MODEM_USE_FAKE:
            logger.warn('*** You are using a SIMULATED modem (MODEM_USE_FAKE = True)! Make sure that is what you want.')
            return Modem(CX930xx_fake, ScriptedModem.from_modem_type(CX930xx_fake))

        logging.info('**** Bootstrapping SERIAL modem at %s' % settings.MODEM_DEVICE)
        return Modem(CX930xx, PySerialDevice(settings.MODEM_DEVICE, settings.MODEM_BAUD))

else:
    def _bootstrap():
        pass
