from django.conf import settings
from django.core.management import BaseCommand, call_command

from callblocker import blocker
from callblocker.blocker import BootstrapMode


class Command(BaseCommand):
    """
    Runs Django and the background modem monitoring loop. Note that this will fail MISERABLY if Django forks, and
    there is no sane way of detecting this here, so the only thing this does is to disable reloading, and enable
    the modem monitoring loop.
    """
    help = 'Runs the Callblocker development server.'

    def execute(self, *args, **options):
        # Sigh. This has to be put here as otherwise BaseCommand
        # will go for urls.py before we had a chance to toggle the flag.
        # Damn this freaking hack.
        blocker.bootstrap_mode(
            BootstrapMode.FAKE_SERVER
            if settings.MODEM_USE_FAKE
            else BootstrapMode.SERVER
        )

        super().execute(*args, **options)

    def handle(self, *args, **options):
        # Runs the actual server.
        call_command('runserver', '--noreload')
