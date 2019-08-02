import logging

from django.conf import settings
from django.db import ProgrammingError

logger = logging.getLogger(__name__)


def handle_connection(**kwargs):
    with kwargs['connection'].cursor() as cursor:
        # Ideally, we'd do this as a migration. But set_limit has to be set on a session basis, so we
        # have to do it here. But then 'manage.py migrate' will trip when it tries to create a connection and
        # calls set_limit before having created pg_trgm. So we have no choice but to probe if the extension
        # has been installed at every connection attempt. We use a long connection life (we expect our DB
        # to be essentially private) so performance should not be a problem.
        try:
            logger.info('installing the pg_trgm extension')
            cursor.execute('CREATE EXTENSION pg_trgm')
        except ProgrammingError as ex:
            # Well this sucks and will break soon, but as usual the info coming from API exception signalling
            # is shit so we have no choice.
            if '"pg_trgm" already exists' not in ex.args[0]:
                raise ex
            logger.info('pg_trgm extension already installed')

        cursor.execute(f'SELECT set_limit({settings.TRGM_SIM_THRESHOLD})')
