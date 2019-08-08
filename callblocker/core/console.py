"""
Simple console for monitoring modem events and running predefined
modem command routines.
"""
import argparse
import asyncio
import sys
from asyncio import CancelledError
from cmd import Cmd

from callblocker.core import healthmonitor
from callblocker.core.modem import Modem, CX930xx, PySerialDevice, ModemException, ModemEvent, bootstrap_modem


class BaseModemConsole(Cmd):
    """
    :class:`Cmd` subclass which sets up an asyncio event loop in a separate daemon thread
    at startup and fires a loop that continuously consumes modem events. Also exposes an exit
    command which stops the event loop and quits the console.
    """

    def __init__(self, stdout, device: str, baud_rate: int):
        super().__init__(stdout=stdout)

        supervisor = healthmonitor.monitor()
        self.modem = Modem(CX930xx, PySerialDevice(device, baud_rate))
        self.aio_loop, _ = bootstrap_modem(self.modem, supervisor)

        self.stream = self.modem.event_stream()
        supervisor.run_coroutine_threadsafe(self.loop(), 'console event loop', self.aio_loop, self._handle_loop_death)

    def do_exit(self, _):
        return True

    def help_exit(self):
        print('Exits this program.')

    def event_received(self, event: ModemEvent):
        # Subclasses should implement this.
        raise NotImplementedError()

    async def loop(self):
        try:
            with self.stream as stream:
                async for event in stream:
                    print('Modem: %s' % event)
        except CancelledError:
            pass

    def _handle_loop_death(self, future):
        exc = future.exception(timeout=1)
        if exc:
            print('Modem monitoring loop died with an exception:\n\n %s \n\nExecution aborted.' % str(exc))
            # This seems to be the cleanest way to abort a Cmd loop running from Django.
            self.cmdqueue.append('exit')


class ModemConsole(BaseModemConsole):

    def __init__(self, stdout, device, baud_rate):
        super().__init__(stdout=stdout, device=device, baud_rate=baud_rate)

    def do_lscommand(self, _):
        print('Valid commands are: %s' % ', '.join(self.modem.modem_type.COMMANDS), file=self.stdout)

    def help_lscommand(self):
        print('Lists predefined commands.')

    def do_runcommand(self, arg):
        if not arg:
            print('Please input a valid command set. See "lscommand" for a list.', file=self.stdout)
            return

        if arg not in self.modem.modem_type.COMMANDS:
            print('Invalid command: %s. See "lscommand" for valid commands.' % arg)
            return

        try:
            asyncio.run_coroutine_threadsafe(self.modem.run_command_set(arg), self.aio_loop).result()
        except asyncio.TimeoutError:
            print('Failed to run command set %s. No reply from modem.' % arg)

    def help_runcommand(self):
        print('Runs a predefined command. See "lscommand for a list."')

    def do_atcommand(self, arg):
        if not arg:
            print('Please input a proper AT command for the modem (e.g ATZ).')

        try:
            asyncio.run_coroutine_threadsafe(self.modem.sync_command(arg), self.aio_loop).result()
        except asyncio.TimeoutError:
            print('No reply from modem. Invalid command?')
        except ModemException as ex:
            print('Failure %s' % str(ex))

    def help_atcommand(self):
        print('Submits an AT command directly to the modem and waits for a reply for ')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--device', help='The modem device file (defaults to "/dev/ttyACM0").', default='/dev/ttyACM0')
    parser.add_argument('--baud', help='The modem\'s baud rate (defaults to 115200).', default=115200, type=int)

    args = parser.parse_args()
    ModemConsole(stdout=sys.stdout, device=args.device, baud_rate=args.baud).cmdloop(
        'Type "help" for available commands.'
    )


if __name__ == '__main__':
    main()
