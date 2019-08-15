from threading import Event, Thread, Lock

from callblocker.core.concurrency import with_monitor, synchronized, _MONITOR_LOCK_ATTR
from callblocker.core.tests.utils import await_predicate


def test_synchronized_locks_methods():
    should_be_locked = Event()

    @with_monitor
    class ConcurrentClass(object):
        def __init__(self):
            self.block = Event()

        @synchronized
        def concurrent_op(self):
            # Makes sure monitors are reentrant.
            self.concurrent_op_inner()

        @synchronized
        def concurrent_op_inner(self):
            should_be_locked.set()
            self.block.wait()

    obj = ConcurrentClass()
    t = Thread(target=obj.concurrent_op)
    t.start()

    # Waits till the thread enters the synchronized method.
    should_be_locked.wait(10)

    # The instance-level lock should be set.
    assert is_locked(getattr(obj, _MONITOR_LOCK_ATTR)), 'Lock was not set.'

    # Releases the blocked thread.
    obj.block.set()

    # We should see the instance-level lock be released.
    await_predicate(lambda: not is_locked(getattr(obj, _MONITOR_LOCK_ATTR)), 10)


def is_locked(lock: Lock) -> bool:
    if lock.acquire(blocking=False):
        lock.release()
        return False

    return True
