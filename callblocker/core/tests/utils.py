import time
from threading import Event
from typing import Callable

import netifaces


class EventWaiter(object):
    def __init__(self):
        self.event = Event()
        self.status = None

    def done(self, status):
        self.status = status
        self.event.set()

    def wait(self, timeout):
        self.event.wait(timeout=timeout)


def await_predicate(predicate: Callable[[], bool], timeout: float):
    start = time.time()
    while time.time() - start < timeout:
        if predicate():
            return
        time.sleep(0.1)

    raise TimeoutError('Predicate timed out.')


def local_ip_addresses():
    return [
        ipv4['addr'] for interface in netifaces.interfaces() for ipv4 in
        netifaces.ifaddresses(interface).get(netifaces.AF_INET, [])
    ]
