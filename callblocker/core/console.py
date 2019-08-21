"""
Simple console for monitoring modem events and running predefined
modem command routines.
"""
import argparse
import asyncio
import sys
from asyncio import CancelledError, AbstractEventLoop
from cmd import Cmd
from typing import Optional

from callblocker.core import modems
from callblocker.core.modem import Modem, ModemException, ModemEvent, PySerialDevice
from callblocker.core.service import AsyncioService, ServiceState, AsyncioEventLoop


class BaseModemConsole(Cmd, AsyncioService):
    """
    :class:`Cmd` subclass which sets up an asyncio event loop in a separate daemon thread
    at startup and fires a loop that continuously consumes modem events. Also exposes an exit
    command which stops the event loop and quits the console.
    """

    name = 'modem console'

    def __init__(self, stdout, modem: Modem, aio_loop_service: AsyncioEventLoop):
        Cmd.__init__(self, stdout=stdout)
        AsyncioService.__init__(self, aio_loop_service=aio_loop_service)
        self.stream = modem.event_stream()

    def do_exit(self, _):
        return True

    def help_exit(self):
        print('Exits this program.')

    def event_received(self, event: ModemEvent):
        # Subclasses should implement this.
        raise NotImplementedError()

    async def _event_loop(self):
        try:
            with self.stream as stream:
                async for event in stream:
                    print('Modem: %s' % event)
        except CancelledError:
            pass

    def _signal_terminated(self):
        super()._signal_terminated()
        status = self.status()
        if status == ServiceState.ERRORED:
            print('Modem monitoring loop died with an exception:\n\n %s \n\nExecution aborted.' % str(status.exception))
            # This seems to be the cleanest way to abort a Cmd loop running from Django.
            self.cmdqueue.append('exit')


class ModemConsole(BaseModemConsole):

    def __init__(self, stdout, modem: Modem, aio_loop_service: AsyncioEventLoop):
        super().__init__(stdout=stdout, modem=modem, aio_loop_service=aio_loop_service)

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
    parser.add_argument('--modem', help='The model for the modem connected to the '
                                        'serial port (defaults to CX930xx).')

    args = parser.parse_args()

    aio_loop = AsyncioEventLoop()
    aio_loop.start()

    modem = Modem(
        modems.get_modem(args.modem),
        PySerialDevice(args.device, args.baud),
        aio_loop
    )
    modem.start()

    console = ModemConsole(stdout=sys.stdout, modem=modem, aio_loop_service=aio_loop)
    console.start()

    console.cmdloop('Type "help" for available commands.')


if __name__ == '__main__':
    main()
