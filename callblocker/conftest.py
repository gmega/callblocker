import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from callblocker.core.service import AsyncioEventLoop, ServiceState
from callblocker.core.tests.fakeserial import ScriptedModem


@pytest.fixture
def fake_serial(aio_loop):
    serial = ScriptedModem(aio_loop_service=aio_loop, defer_script=True)
    yield serial

    if serial.status().state not in ServiceState.halted_states():
        serial.stop(10)


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_command('loaddata', 'initial.yaml')
        call_command('loaddata', 'sample_data.yaml')


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def aio_loop():
    loop = AsyncioEventLoop()
    loop.sync_start()
    yield loop
    loop.sync_stop(10)
