import abc
import logging
from abc import abstractmethod

from django.utils import timezone

from callblocker.blocker.models import Caller, Call, Source
from callblocker.core.modem import Modem, ModemType, ModemEvent

logger = logging.getLogger(__name__)


class Provider(abc.ABC):

    @abstractmethod
    def parse_cid(self, string: str) -> Caller:
        pass


class Vivo(Provider):
    def parse_cid(self, cid_string: str) -> Caller:
        return Caller(
            number=cid_string[-9:],
            area_code=cid_string[-11:-9],
            source=Source.predef_source(Source.CID),
            block=False
        )


class CallMonitor(object):
    def __init__(self, provider: Provider, modem: Modem):
        self.provider = provider
        self.modem = modem
        self.stream = modem.event_stream()

    async def loop(self):
        with self.stream as stream:
            async for event in stream:
                await self._process_event(event)

    async def _process_event(self, event: ModemEvent):
        # We only care about call ids. It's easier.
        if event.event_type != 'CALL_ID':
            logger.info('Discarding uninteresting modem event %s' % str(event))
            return

        # Parses the phone number.
        number = self.provider.parse_cid(event.contents)
        logger.info('Got call from number %s ' % str(number))

        # Looks for blacklisted counterpart:
        try:
            logger.info('Number %s was found in the phonebook.' % str(number))
            matching = Caller.objects.get(
                number__endswith=number.number,
                area_code=number.area_code
            )
        except Caller.objects.model.DoesNotExist:
            logger.info('Number %s is a new number.' % str(number))
            matching = number
            number.date_inserted = timezone.now()
            number.save()

        # Logs the call.
        Call(
            caller=matching,
            time=timezone.now(),
            blocked=matching.block
        ).save()

        # Number is blacklisted. Hangs up!
        if matching.block:
            logger.info(
                'Dropping call for BLOCKED number %s.' % str(matching))
            await self.modem.run_command_set(ModemType.DROP_CALL)
        else:
            logger.info('Call from %s ALLOWED.' % str(matching))
