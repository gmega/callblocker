from threading import RLock

_MONITOR_LOCK_ATTR = 'monitor_lock'


def with_monitor(cls: type) -> type:
    cls.__init__ = _wrap_init(cls)
    return cls


def synchronized(method):
    def synchronized_method(self, *args, **kwargs):
        if not hasattr(self, _MONITOR_LOCK_ATTR):
            raise Exception('Cannot synchronize method of a class which does not have the with_monitor decorator.')
        with getattr(self, _MONITOR_LOCK_ATTR):
            method(self, *args, **kwargs)

    return synchronized_method


def _wrap_init(cls):
    init = cls.__init__

    def wrapped_init(self, *args, **kwargs):
        init(self, *args, **kwargs)
        if hasattr(self, _MONITOR_LOCK_ATTR):
            raise Exception(f'Cannot decorate class {cls}: attribute {_MONITOR_LOCK_ATTR} already present.')
        setattr(self, _MONITOR_LOCK_ATTR, RLock())

    return wrapped_init
