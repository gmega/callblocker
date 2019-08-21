import logging
from collections import OrderedDict, namedtuple
from typing import TypeVar

logger = logging.getLogger(__name__)

T = TypeVar('T', bound='Service')

ServiceEntry = namedtuple('ServiceEntry', ['service', 'deps'])


class ServiceGroup(object):

    def __init__(self):
        self._services = OrderedDict()

    @property
    def services(self):
        return self._services.values()

    def register_service(self, service: T) -> T:
        self._services[service.id] = service
        setattr(self, service.id, service)
        return service

    def start(self):
        # Will improve once we have dep tracking and chained
        # async startup/shutdown.
        for service in self.services:
            service.sync_start()

    def shutdown(self):
        for service in self.services:
            service.sync_stop()


class ServiceGroupSpec(object):
    def __init__(self, **kwargs):
        self.services = kwargs

    def bootstrap(self) -> ServiceGroup:
        group = ServiceGroup()
        for key, initializer in self.services.items():
            instance = initializer(group)
            # I could complicate this by patching in a mixin with a readonly property
            # or using descriptors, but this is simply easier.
            instance.id = key
            group.register_service(instance)

        return group
