import threading
from cmd import Cmd

from django.core.management import BaseCommand

from callblocker.blocker.modem import Modem, CX930xx


class Command(BaseCommand):
    help = 'Simple program for monitoring blocker output.'

    def handle(self, *args, **options):
        self.stderr.write('Starting monitor.')
        Prompt(self.stdout).cmdloop()


class Prompt(Cmd):

    def __init__(self, stdout):
        super().__init__(stdout=stdout)
        self.modem = Modem(CX930xx)

    def do_dettach(self, _):
        self.modem.close()

    def do_commands(self, _):
        print('Valid commands are: %s' % ', '.join(self.modem.modem_type.keys()), file=self.stdout)

    def do_command(self, arg):
        if not arg:
            print('Please input a valid command. See "commands" for a list.', file=self.stdout)
            return

        self.modem.run_command_set(arg)

    def do_monitor(self, _):
        Monitor(self.modem, self.stdout).start()


class Monitor(object):
    def __init__(self, modem, stdout):
        self.modem = modem
        self.stdout = stdout
        self.thread = None
        self.running = True

    def start(self):
        if self.thread is not None:
            return
        self.thread = threading.Thread(target=self._monitor_loop)
        self.thread.start()

    def stop(self):
        self.running = False
        self.thread = None

    def _monitor_loop(self):
        try:
            print('Begin monitoring modem.', file=self.stdout)
            with self.modem.event_stream(read_timeout=1) as stream:
                while self.running:
                    for event in stream:
                        print(event, file=self.stdout)
        finally:
            print('Stop monitoring modem.')
