from django.conf import settings

from callblocker.blocker import BOOTSTRAP_CALLMONITOR
from callblocker.blocker.callmonitor import CallMonitor, Vivo
from callblocker.core import healthmonitor
from callblocker.core.modem import Modem, CX930xx, PySerialDevice, bootstrap_modem

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
if BOOTSTRAP_CALLMONITOR:

    def bootstrap_callmonitor(modem: Modem = None) -> CallMonitor:
        supervisor = healthmonitor.monitor()
        modem = modem if modem is not None else modem_from_settings()

        aio_loop, _ = bootstrap_modem(modem, supervisor)

        blocker = CallMonitor(Vivo(), modem)
        supervisor.run_coroutine_threadsafe(blocker.loop(), 'call monitor event loop', aio_loop)

        return blocker


    def modem_from_settings() -> Modem:
        return Modem(CX930xx, PySerialDevice(settings.MODEM_DEVICE, settings.MODEM_BAUD))

else:
    def bootstrap_callmonitor():
        pass
