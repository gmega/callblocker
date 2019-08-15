import logging
from typing import Dict, Any, TypeVar

from callblocker.core.service import Service, ServiceState

logger = logging.getLogger(__name__)


def exports(fun):
    fun.service_export = True
    return fun


T = TypeVar('T', bound='Service')


class ServiceRegistry(object):
    def __init__(self):
        self.services = {}

    def register_service(self, service: T) -> T:
        self.services[service.name] = service
        return service

    def health(self) -> Dict[str, Any]:
        report = []
        for name, service in self.services.items():
            status = service.status()
            task_report = {
                'name': name,
                'status': status.state.name
            }
            if service.state == ServiceState.ERRORED:
                task_report['exception'] = str(status.exception)
                task_report['traceback'] = status.traceback
            report.append(task_report)

        return {'services': report}


_registry = ServiceRegistry()


def registry() -> ServiceRegistry:
    return _registry
