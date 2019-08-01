from django.apps import AppConfig
from django.db.backends.signals import connection_created

from callblocker.blocker.api.text_search import handle_connection


class BlockerConfig(AppConfig):
    name = 'callblocker.blocker'

    def ready(self):
        connection_created.connect(handle_connection)
