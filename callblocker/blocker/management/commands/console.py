import re
from typing import Union

from django.conf import settings
from django.core.management import BaseCommand
from django.utils import timezone

from callblocker import blocker
from callblocker.blocker import BootstrapMode, services
from callblocker.blocker.models import Caller, Source, Call
from callblocker.core.console import BaseModemConsole


class Command(BaseCommand):
    help = 'Starts the call monitor console app.'

    def handle(self, *args, **options):
        blocker.bootstrap_mode(
            BootstrapMode.FAKE_SERVER
            if settings.MODEM_USE_FAKE
            else BootstrapMode.SERVER
        )

        Console(
            stdout=self.stdout,
            modem=services.services().modem
        ).cmdloop('Type "help" to see available commands.')


class Console(BaseModemConsole):
    NUMBER_REGEX = re.compile(r'([0-9]+) ([0-9]+)\s*$')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def do_blocknumber(self, arg):
        number = self._get_number(arg)
        if not number:
            return
        number.block = True
        number.save()
        print('Number %s will now be blocked.' % arg)

    def help_blocknumber(self):
        return 'Starts blocking a given number'

    def do_clearnumber(self, arg):
        number = self._get_number(arg)
        if not number:
            return
        number.block = False
        number.save()
        print('Number %s will now be allowed.' % arg)

    def do_status(self, arg):
        number = self._get_number(arg, create=False)
        if not number:
            return
        print('Number is %s.' % ('BLOCKED' if number.block else 'ALLOWED'))

    def help_clearnumber(self):
        return 'Stops blocking a given number.'

    def do_listcalls(self, arg):
        number = self._get_number(arg, create=False)
        if not number:
            return

        print('Call records for %s %s:' % (number.area_code, number.number))

        for record in Call.objects.filter(caller=number):
            print('- at %s, %s' % (record.time.isoformat(), ('BLOCKED' if record.blocked else 'ALLOWED')))

    def help_listcalls(self):
        return 'Lists logged calls for a given number.'

    def _get_number(self, number, create=True) -> Union[Caller, None]:
        parsed = self._parse_number(number)
        if not parsed:
            return None

        area_code, number = parsed
        matching = None
        try:
            matching = Caller.objects.get(
                area_code=area_code,
                number=number
            )
            print('Number FOUND in phonebook.')
        except Caller.DoesNotExist:
            print('Number NOT FOUND in phonebook.')
            if create:
                print('Number ADDED to phonebook.')
                matching = Caller(
                    source=Source.predef_source(Source.USER),
                    area_code=area_code,
                    number=number,
                    block=False,
                    date_inserted=timezone.now()
                )
                matching.save()

        return matching

    def _parse_number(self, number):
        match = self.NUMBER_REGEX.match(number)
        if match is None:
            print('Invalid number %s. Valid numbers have an area '
                  'code followed by the number, e.g. 11 99992223.' % number)
            return None
        return match.groups()
