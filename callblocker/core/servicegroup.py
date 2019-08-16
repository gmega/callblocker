import logging
from typing import Dict, Any, TypeVar

from callblocker.core.service import ServiceState

logger = logging.getLogger(__name__)

T = TypeVar('T', bound='Service')


class ServiceGroup(object):

    def __init__(self):
        self.keys = []

    def register_service(self, name: str, service: T) -> T:
        self.keys.append(name)
        setattr(self, name, service)
        return service

    def shutdown(self):
        for service in self.keys:
            service.stop()

    def health(self) -> Dict[str, Any]:
        report = []
        for key in self.keys:
            service = getattr(self, key)
            status = service.status()
            task_report = {
                'name': service.name,
                'status': status.state.name
            }
            if service.state == ServiceState.ERRORED:
                task_report['exception'] = str(status.exception)
                task_report['traceback'] = status.traceback
            report.append(task_report)

        return {'services': report}


class ServiceGroupSpec(object):
    def __init__(self, **kwargs):
        self.services = kwargs

    def bootstrap(self) -> ServiceGroup:
        group = ServiceGroup()
        for key, initializer in self.services.items():
            group.register_service(key, initializer(group)).start()

        return group
