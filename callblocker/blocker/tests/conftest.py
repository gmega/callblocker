import pytest
from django.core.management import call_command

from callblocker.blocker.tests.fakeserial import FakeSerial


@pytest.fixture
def fake_serial():
    serial = FakeSerial()
    yield serial


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_command('loaddata', 'initial.yaml')
