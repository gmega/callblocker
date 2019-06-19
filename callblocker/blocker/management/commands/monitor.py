import asyncio
from asyncio import CancelledError
from cmd import Cmd
from threading import Thread

from django.conf import settings
from django.core.management import BaseCommand

from callblocker.blocker.modem import Modem, CX930xx, PySerialDevice


class Command(BaseCommand):
    help = 'Simple program for monitoring blocker output.'

    def handle(self, *args, **options):
        Prompt(self.stdout).cmdloop()


class Prompt(Cmd):

    def __init__(self, stdout):
        super().__init__(stdout=stdout)
        self.loop = asyncio.new_event_loop()
        self.modem = Modem(CX930xx, PySerialDevice(settings.MODEM_DEVICE, settings.MODEM_BAUD), self.loop)
        self.loop_thread = Thread(target=lambda: self.loop.run_forever())
        self.loop_thread.start()

        asyncio.run_coroutine_threadsafe(self.modem.loop(), self.loop)
        self._enable_monitor()

    def do_dettach(self, _):
        self.modem.close()

    def do_commands(self, _):
        print('Valid commands are: %s' % ', '.join(self.modem.modem_type.COMMANDS), file=self.stdout)

    def do_command(self, arg):
        if not arg:
            print('Please input a valid command set. See "commands" for a list.', file=self.stdout)
            return

        if arg not in self.modem.modem_type.COMMANDS:
            print('Invalid command: %s. See "commands" for valid commands.' % arg)
            return

        self._wait(asyncio.run_coroutine_threadsafe(self.modem.run_command_set(arg), self.loop))

    def do_atcommand(self, arg):
        if not arg:
            print('Please input a proper AT command for the modem (e.g ATZ).')

        self._wait(asyncio.run_coroutine_threadsafe(self.modem.sync_command(arg), self.loop))

    def _wait(self, fut):
        try:
            fut.result(timeout=5)
        except asyncio.TimeoutError:
            print('No reply from modem. Invalid command?')
        except Exception as ex:
            print('Error from modem: %s' % str(ex))

    def _enable_monitor(self):
        async def loop():
            try:
                with self.modem.event_stream() as stream:
                    async for event in stream:
                        print('Modem: %s' % event)
            except CancelledError:
                pass

        self.monitor_task = asyncio.run_coroutine_threadsafe(loop(), self.loop)
