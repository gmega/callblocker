from threading import Event


class EventWaiter(object):
    def __init__(self):
        self.event = Event()
        self.status = None

    def done(self, status):
        self.status = status
        self.event.set()

    def wait(self, timeout):
        self.event.wait(timeout=timeout)
