from django.core.management.commands import runserver

from callblocker import blocker


class Command(runserver.Command):
    """
    Runs Django and the background modem monitoring loop. Note that this will fail MISERABLY if Django forks, and
    there is no sane way of detecting this here, so the only thing this does is to disable reloading. The event
    loop bootstrap is actually handled by the WSGI application init code.
    """
    help = 'Runs the callblocker server.'

    def handle(self, *args, **options):
        options['use_reloader'] = False
        # Sigh.
        blocker.enable()
        # Runs the actual server.
        super().handle(*args, **options)
