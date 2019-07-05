import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from callblocker.core.tests.fakeserial import FakeSerial


@pytest.fixture
def fake_serial():
    serial = FakeSerial()
    yield serial


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_command('loaddata', 'initial.yaml')
        call_command('loaddata', 'sample_data.yaml')


@pytest.fixture()
def api_client():
    return APIClient()
