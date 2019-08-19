import asyncio
from asyncio import Event as AIOEvent
from threading import Event as ThreadingEvent

from callblocker.core.service import AsyncioService, ServiceState, ThreadedService, BaseService
from callblocker.core.tests.utils import await_predicate


class BuggyAsyncService(AsyncioService):
    name = 'buggy asyncio'

    def __init__(self, aio_loop):
        super().__init__(aio_loop)
        self.running = AIOEvent(loop=aio_loop)
        self.should_error = True

    def die(self):
        async def setter():
            self.running.set()

        self.should_error = True
        asyncio.run_coroutine_threadsafe(setter(), self.aio_loop)

    async def _event_loop(self):
        self.should_error = False
        self.running.clear()
        self._signal_started()
        await self.running.wait()
        if self.should_error:
            raise Exception("Oh I'm so buggy.")


class BuggyThreadedService(ThreadedService):
    name = 'buggy threaded'

    def __init__(self):
        super().__init__()
        self.running = ThreadingEvent()
        self.should_error = True

    def die(self):
        self.should_error = True
        self.running.set()

    def _event_loop(self):
        self.should_error = False
        self.running.clear()
        self._signal_started()
        # Waits till stop or die.
        self.running.wait()
        if self.should_error:
            raise Exception("Oh I'm so buggy.")

    def _halt_event_loop(self):
        self.running.set()


def test_async_service(aio_loop):
    service_test(BuggyAsyncService(aio_loop.aio_loop))


def test_threaded_service():
    service_test(BuggyThreadedService())


def service_test(service: BaseService):
    assert service.status().state == ServiceState.INITIAL
    service.sync_start(10)

    # We did a synchronous start so we should see this immediately.
    assert service.status().state == ServiceState.READY

    service.die()
    await_predicate(lambda: service.status().state == ServiceState.ERRORED, 5)

    try:
        # Trying to stop a dead service should raise an exception.
        service.stop()
    except ValueError:
        pass

    # The offending exception should have been caught.
    assert service.status().exception.args[0] == "Oh I'm so buggy."

    # Restarting the service should bring it back to running.
    service.sync_start()

    assert service.status().state == ServiceState.READY
    service.startup.wait(10)
    # Trying to start a started service should cause an exception.
    try:
        # Trying to stop a dead service should raise an exception.
        service.start()
    except ValueError:
        pass

    # Normal termination.
    service.sync_stop(10)

    # Since we did a synchronous stop, we should see the correct state.
    assert service.status().state == ServiceState.TERMINATED
    assert service.status().exception is None
    assert service.status().traceback is None
