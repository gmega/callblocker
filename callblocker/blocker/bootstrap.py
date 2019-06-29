from callblocker.blocker import BOOTSTRAP_CALLMONITOR

# Hack so that we don't try to contact the modem on every command (e.g. loaddata).
if BOOTSTRAP_CALLMONITOR:
    # Imports moved here so that apps can set the _DO_BOOTSTRAP flag
    # without triggering model initialization.
    from django.conf import settings
    from callblocker.blocker.callmonitor import CallMonitor, Vivo
    from callblocker.core import healthmonitor
    from callblocker.core.modem import Modem, CX930xx, PySerialDevice, bootstrap_modem


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
