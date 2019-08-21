import asyncio
import logging
import sys
import traceback
from abc import ABC, abstractmethod, abstractproperty
from asyncio import AbstractEventLoop, Task
from enum import Enum
from threading import Thread, Event
from typing import Optional

from callblocker.core.concurrency import with_monitor, synchronized

logger = logging.getLogger(__name__)


class ServiceState(Enum):
    """
    Describes the current state of a given :class:`Service`.
    """
    INITIAL = 0  #: The service has never been run and is ready to be started.
    STARTING = 1  #: The service is currently starting up.
    READY = 2  #: The service is currently running and ready to perform its duties.
    STOPPING = 3  #: The service is shutting down.
    ERRORED = 4  #: The service has terminated with an error.
    TERMINATED = 5  #: The service has terminated gracefully.

    @staticmethod
    def running_states():
        return {ServiceState.STARTING, ServiceState.READY, ServiceState.STOPPING}

    @staticmethod
    def halted_states():
        return {ServiceState.INITIAL, ServiceState.ERRORED, ServiceState.TERMINATED}


class ServiceStatus(object):
    """
    Describes the status for a :class:`Service`.

    :ivar state: The :class:`ServiceState` for the current service.
    :ivar exception: If ``state == ERRORED``, contains the exception which caused the service to die.
    :ivar traceback: If ``state == ERRORED``, contains a string representation of the traceback for the 
    exception that caused the service to die.
    """

    def __init__(self, state: ServiceState, exception: Optional[Exception] = None, traceback: Optional[str] = None):
        self.state = state
        if (state == ServiceState.ERRORED) and (exception is None or traceback is None):
            raise ValueError('Service error states require an exception and a traceback.')

        self.exception = exception
        self.traceback = traceback


class Service(ABC):
    """
    A :class:`Service` is a functional unit of the application which exposes a well-defined
    interface for initialization and status monitoring. Given the size of our application,
    we do not model anything else. Service wiring, in particular, is performed by ad hoc
    code written elsewhere.
    """

    @abstractmethod
    def start(self) -> 'Service':
        """
        Starts the current service if it has never been started, or attempts to restart it
        if the service died because of an error or was otherwise terminated. This operation
        is asynchronous.

        :return: the service itself.
        :raise ValueError: if :meth:`Service.status` returns a :meth:`ServiceState` that is
                            either STARTING, READY, or STOPPED.
        """
        pass

    @abstractmethod
    def sync_start(self, timeout=None) -> 'Service':
        pass

    @abstractmethod
    def stop(self) -> 'Service':
        pass

    @abstractmethod
    def sync_stop(self, timeout=None) -> 'Service':
        pass

    @abstractmethod
    def status(self) -> ServiceStatus:
        """
        :return: a :class:`ServiceStatus` summarizing the current status for this service.
        """
        pass

    @abstractproperty
    def name(self) -> str:
        """
        :return: a human-readable name for the service.
        """
        pass


@with_monitor
class BaseService(Service):
    """Base implementation for a service which runs on a separate thread, possibly as part of an
    asyncio event loop."""

    def __init__(self):
        self._error = {}
        self._state = ServiceState.INITIAL

        # Events for those who want synchronous start/stop.
        self.startup = Event()
        self.shutdown = Event()

    @synchronized
    def start(self) -> Service:
        self._disallow_states(*ServiceState.running_states())

        try:
            # Startup protocol:
            # Preconditions:
            # a. We know that the service is not running.
            # b. We know no other thread can change that in the meantime as we're
            #    holding the monitor lock on start/stop.

            # 1. sets state to STARTING and clears the error state (this is a new run).
            self._state = ServiceState.STARTING
            self._error = {}

            # 2. clears the startup and shutdown events BEFORE firing the event loop.
            self.startup.clear()
            self.shutdown.clear()

            # 3. Starts the event loop.
            logger.info(f'Starting service {self.name}')
            self._start_event_loop()
            return self
        except:
            self._capture_error()
            self._signal_terminated()
            raise

    def sync_start(self, timeout=None):
        self.start()
        self.startup.wait(timeout=timeout)

    @synchronized
    def _signal_started(self) -> Service:
        self._allow_states(ServiceState.STARTING)
        # Once the startup signal is given, sets the state to running. Clearly, the service may have
        # already died in the meantime, but the "death signal" won't be missed as we're holding the
        # same monitor lock as _handle_termination.
        self._state = ServiceState.READY
        logger.info(f'{self.name} is now running')
        self.startup.set()
        return self

    @synchronized
    def stop(self, timeout=None) -> Service:
        self._allow_states(ServiceState.READY)

        try:
            # Shutdown protocol:
            # Preconditions:
            # a. We know that the service is running.
            # b. We know that the state won't change as run this method because we have the monitor lock.
            #    Unlike with startup, however, the service CAN die spontaneously as we run this method, and
            #    we have to account for that.

            # 1. Sets the service state to stopping.
            self._state = ServiceState.STOPPING
            logger.info(f'Stopping service {self.name}')

            # 2. Halts the event loop. If the service is already dead, this should be a no-op.
            self._halt_event_loop()

            return self
        except:
            # We actually cannot know the state of the service when an exception is thrown halfway through
            # a shutdown. It may have stayed in an inconsistent state which cannot be recovered from.
            self._capture_error()
            self._signal_terminated()
            raise

    def sync_stop(self, timeout=None):
        self.stop()
        self.shutdown.wait(timeout=timeout)

    @synchronized
    def _signal_terminated(self):
        # Service had to be running.
        self._allow_states(*ServiceState.running_states())
        self._state = ServiceState.ERRORED if self._error else ServiceState.TERMINATED
        logger.info(f'{self.name} has terminated with state {self._state}')
        self.shutdown.set()
        # Service may die during startup, so we have to set this too.
        self.startup.set()

    def status(self) -> ServiceStatus:
        return ServiceStatus(self._state, **self._error)

    @abstractmethod
    def _start_event_loop(self):
        """
        Asynchronously fires the event loop for this service, potentially in a separate thread. Event loop
        implementations MUST:

        1. signal when the service is ready by calling _signal_started;
        2. signal when the service dies/stops by calling _signal_terminated;
        3. call _capture_error whenever the service terminates due to an unhandled exception,
           and do so BEFORE calling _signal_terminated. A typical event loop would look like this:

        .. code-block:: python

            try:
                self.run_event_loop()
            except:
                self._capture_error()
            finally:
                self._signal_terminated()


        :param on_termination: a callback to be invoked upon service termination (either due to an error, or
                               due to graceful termination).
        """
        pass

    @abstractmethod
    def _halt_event_loop(self):
        """
        Asynchronously halts the event loop. The event loop should stop as soon as possible once this
        method has been called. If the event loop has already stopped, this must be a no-op.
        """
        pass

    def _capture_error(self):
        exc_type, value, tb = sys.exc_info()
        self._error = {'exception': value, 'traceback': traceback.format_tb(tb)}
        return self._error

    def _disallow_states(self, *args: ServiceState):
        state = self.status().state
        if any(state == disallowed for disallowed in args):
            raise ValueError(f'Cannot call method while in state {state}.')

    def _allow_states(self, *args: ServiceState):
        state = self.status().state
        if all(state != allowed for allowed in args):
            raise ValueError(f'{state} is not an allowed state for calling this method.')


class AsyncioService(BaseService):
    """
    Base implementation for services which run their event loop as a coroutine. Clients must provide an
    event loop as a coroutine. _shutdown_event management is done automatically, but clients must still
    set _startup_event as part of event loop initialization.
    """

    def __init__(self, aio_loop_service: 'AsyncioEventLoop'):
        super().__init__()
        self._aio_loop_service = aio_loop_service
        self.future = None

    def _start_event_loop(self):
        self.future = asyncio.run_coroutine_threadsafe(self._wrapped_loop(self._event_loop()), self.aio_loop)

    async def _wrapped_loop(self, coro):
        try:
            await coro
            self._graceful_cleanup()
        except asyncio.CancelledError:
            logger.info(f'{self.name} event loop: caught stop request.')
            self._graceful_cleanup()
        except:
            self._capture_error()
        finally:
            self._signal_terminated()

    @property
    def aio_loop(self):
        return self._aio_loop_service.aio_loop

    def _halt_event_loop(self):
        self.future.cancel()

    @abstractmethod
    async def _event_loop(self):
        pass

    def _graceful_cleanup(self):
        pass


class ThreadedService(BaseService):
    """
    Base implementation for services which run their event loop as a regular function (not a coroutine)
    in a dedicated thread. _shutdown_event management is done automatically, but clients must still
    set _startup_event as part of event loop initialization.
    """

    def __init__(self):
        super().__init__()

    def _start_event_loop(self):
        self.thread = Thread(
            target=self._wrap_loop(),
            name=f'{self.name} thread',
            daemon=True
        )
        self.thread.start()

    def _wrap_loop(self):
        def wrapped_loop():
            try:
                self._event_loop()
            except:
                self._capture_error()
            finally:
                self._signal_terminated()

        return wrapped_loop

    @abstractmethod
    def _event_loop(self):
        pass


class AsyncioEventLoop(ThreadedService):
    """
    A :class:`ThreadedService` which spawns an asyncio event loop in a separate thread.
    """
    name = 'asyncio event loop'

    def __init__(self):
        super().__init__()
        self._aio_loop = None

    def _event_loop(self):
        self._aio_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._aio_loop)
        self._signal_started()
        self._aio_loop.run_forever()

    def _halt_event_loop(self):
        # Stopping this loop will cancel all tasks.
        async def cancel_tasks():
            current = Task.current_task(self._aio_loop)
            tasks = [
                task for task in Task.all_tasks(self._aio_loop)
                if task is not current
            ]

            for task in tasks:
                task.cancel()

            await asyncio.gather(*tasks)

        # Calling stop directly from cancel_tasks causes things to hang.
        # So we call it from here, after all tasks had a chance to be
        # cancelled, and do not expect the loop to do anything else after
        # that.
        def stop_loop(_):
            self._aio_loop.call_soon_threadsafe(self._aio_loop.stop)

        # Some contortionism is needed.
        asyncio.run_coroutine_threadsafe(
            cancel_tasks(), self._aio_loop
        ).add_done_callback(
            stop_loop
        )

    @property
    def aio_loop(self) -> AbstractEventLoop:
        self._allow_states(ServiceState.READY)
        return self._aio_loop
