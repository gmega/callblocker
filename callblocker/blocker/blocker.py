import abc
import logging
from abc import abstractmethod
from datetime import datetime

from callblocker.blocker.models import PhoneNumber, CallEvent, Source
from callblocker.blocker.modem import Modem, ModemType, Token

logger = logging.getLogger(__name__)


class Provider(abc.ABC):

    @abstractmethod
    def parse_cid(self, string: str) -> PhoneNumber:
        pass


class Vivo(Provider):
    def parse_cid(self, cid_string: str) -> PhoneNumber:
        return PhoneNumber(
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

    async def _process_event(self, event: Token):
        # We only care about call ids. It's easier.
        if event.token_type != 'CALL_ID':
            logger.info('Discarding uninteresting modem event %s' % str(event))
            return

        # Parses the phone number.
        number = self.provider.parse_cid(event.contents)

        # Looks for blacklisted counterpart:
        try:
            matching = PhoneNumber.objects.get(
                number__endswith=number.number,
                area_code=number.area_code
            )
        except PhoneNumber.objects.model.DoesNotExist:
            matching = number
            number.save()

        # Logs the call.
        CallEvent(
            number=matching,
            time=datetime.now(),
            blocked=matching.block
        ).save()

        # Number is blacklisted. Hangs up!
        if matching.block:
            logger.info(
                'Dropping call for number %s.' % str(matching))
            await self.modem.run_command_set(ModemType.DROP_CALL)
