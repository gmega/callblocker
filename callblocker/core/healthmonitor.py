import asyncio
import logging
import threading
import traceback
from concurrent.futures import Future
from functools import partial

from threading import Thread
from typing import Union, Dict, Any

logger = logging.getLogger(__name__)


class HealthMonitor(object):
    """
    :class:`HealthMoitor` wraps threads and coroutines so that we get proper notification
    of their untimely death. This allows us to take action such as notifying the user that
    the server is broken, or triggering an automatic server restart.
    """
    def __init__(self):
        self.status = {}

    def run_coroutine_threadsafe(self, coro, name, loop, callback=None) -> Future:
        status = TaskStatus(coro, name, callback)

        # We have to wrap the coroutine or we'll lose the traceback.
        future = asyncio.run_coroutine_threadsafe(self._wrap_coro(coro, status), loop)

        self.status[id(future)] = status
        future.add_done_callback(self._handle_coro_death)
        return future

    def thread(self, name=None, group=None, target=None,
               args=(), kwargs=None, *, daemon=None, callback=None) -> Thread:

        thread = Thread(
            group=group,
            target=partial(self._run_thread, _target=target),
            name=name,
            args=args,
            kwargs=kwargs,
            daemon=daemon
        )

        self.status[id(thread)] = TaskStatus(thread, thread.name, callback)
        return thread

    def _run_thread(self, _target, *args, **kwargs):
        thread = threading.current_thread()
        status = self.status[id(thread)]
        try:
            _target(*args, **kwargs)
        except Exception as ex:
            status.exception = ex
            status.traceback = traceback.format_exc()

        self._handle_death(status)

    async def _wrap_coro(self, coro, status):
        try:
            await coro
        except Exception as ex:
            status.exception = ex
            status.traceback = traceback.format_exc()

    def _handle_coro_death(self, future: Future):
        assert future.done()
        status = self.status[id(future)]
        self._handle_death(status)

    def _handle_death(self, status):
        # For now, just make some noise so we know shit went wrong.
        if status.exception is not None:
            logger.error('%s died unexpectedly with exception:\n %s\n' % (status.name, str(status.exception)))

        status.callback(status)

    def health(self) -> Dict[str, Any]:
        report = []
        for status in list(self.status.values()):
            task_report = {
                'name': status.name,
                'healthy': status.is_healthy()
            }
            if status.exception is not None:
                task_report['exception'] = str(status.exception)
                task_report['traceback'] = status.traceback
            report.append(task_report)

        return {'tasks': report}


class TaskStatus(object):
    def __init__(self, task: Union[Future, Thread], name: str, callback=None):
        self.name = name
        self.task = task
        self.exception = None
        self.traceback = None
        self.callback = lambda x: x if callback is None else callback

    def is_healthy(self):
        return self.exception is None


_monitor = HealthMonitor()


def monitor() -> HealthMonitor:
    return _monitor
