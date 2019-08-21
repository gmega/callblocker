import json

from rest_framework import status

from callblocker.blocker import services
from callblocker.blocker.services import bootstrap
from callblocker.core.service import Service, ServiceStatus, ServiceState
from callblocker.core.servicegroup import ServiceGroupSpec


class FlippinService(Service):
    def __init__(self, name):
        self.state = ServiceState.INITIAL
        self._name = name
        self.exception = None
        self.traceback = None

    def start(self) -> 'Service':
        self.state = ServiceState.READY
        return self

    def sync_start(self, timeout=None):
        self.start()

    def stop(self) -> 'Service':
        self.state = ServiceState.TERMINATED
        return self

    def sync_stop(self, timeout=None):
        self.stop()

    def status(self) -> ServiceStatus:
        return ServiceStatus(
            self.state,
            self.exception,
            self.traceback
        )

    @property
    def name(self) -> str:
        return self._name


def test_provides_correct_service_status(api_client):
    bootstrap_spec(
        spec=ServiceGroupSpec(
            fp1=lambda _: FlippinService('FlippingService 1'),
            fp2=lambda _: FlippinService('FlippingService 2'),
            fp3=lambda _: FlippinService('FlippingService 3')
        )
    )

    summary = api_client.get('/api/services/').json()

    for i, element in enumerate(summary, start=1):
        assert element['id'] == f'fp{i}'
        assert element['name'] == f'FlippingService {i}'
        assert element['status']['state'] == 'READY'

    fp1 = services.services().fp1
    fp1.state = ServiceState.ERRORED
    fp1.exception = EOFError('Ooops!')
    fp1.traceback = ['Ooops']

    fp1_summary = api_client.get('/api/services/fp1/').json()
    assert fp1_summary['id'] == 'fp1'
    assert fp1_summary['status']['state'] == 'ERRORED'
    assert fp1_summary['status']['exception'] == 'EOFError: Ooops!'
    assert fp1_summary['status']['traceback'] == ['Ooops']


def test_starts_stops_service(api_client):
    bootstrap_spec(
        ServiceGroupSpec(
            fp1=lambda _: FlippinService('FlippingService 1')
        )
    )

    assert api_client.get('/api/services/fp1/').json()['status']['state'] == 'READY'

    for target in ['TERMINATED', 'READY']:
        result = api_client.patch(
            '/api/services/fp1/',
            data=json.dumps({
                'status': {'state': target}
            }),
            content_type='application/json'
        )

        assert result.status_code == status.HTTP_202_ACCEPTED
        assert services.services().fp1.status().state == ServiceState[target]


def test_raises_400_on_malformed_request(api_client):
    bootstrap_spec(
        ServiceGroupSpec(
            fp1=lambda _: FlippinService('FlippingService 1')
        )
    )

    assert api_client.patch(
        '/api/services/fp1/',
        data=json.dumps({
            'state': 'TERMINATED'
        }),
        content_type='application/json'
    ).status_code == 400


def bootstrap_spec(spec):
    # This is hacky, and will improve as I figure out an
    # API for it.

    # Triggers the bootstrap call in urls.py
    from callblocker import urls

    # Overrides it with our stuff.
    setattr(services, 'custom', spec)
    bootstrap('custom').start()
