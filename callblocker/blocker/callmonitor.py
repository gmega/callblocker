import abc
import logging
from abc import abstractmethod
from asyncio import AbstractEventLoop

from django.db import transaction
from django.utils import timezone

from callblocker.blocker.models import Caller, Call
from callblocker.core.modem import Modem, ModemType, ModemEvent
from callblocker.core.service import AsyncioService

logger = logging.getLogger(__name__)


class CIDParseError(Exception):
    pass


class TelcoProvider(abc.ABC):

    @abstractmethod
    def parse_cid(self, string: str) -> Caller:
        """
        Parses a Caller ID (CID) string into a :class:`Caller` object.

        :param string: a CID string.
        :raise CIDParseError: if the CID string is not in accordance to this provider's rules.
        :return: a :class:`Caller`.
        """
        pass


class CallMonitor(AsyncioService):
    name = 'call monitor'

    def __init__(self, provider: TelcoProvider, modem: Modem, aio_loop: AbstractEventLoop):
        super().__init__(aio_loop=aio_loop)
        self.provider = provider
        self.modem = modem
        self.stream = modem.event_stream()

    async def _event_loop(self):
        self._signal_started()
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
            matching = Caller.objects.get(
                number__endswith=number.number,
                area_code=number.area_code
            )
            logger.info('Number %s was found in the phonebook.' % str(number))
        except Caller.objects.model.DoesNotExist:
            logger.info('Number %s is a new number.' % str(number))
            matching = number
            number.date_inserted = timezone.now()

        now = timezone.now()

        with transaction.atomic():
            # Updates last called.
            matching.last_call = now
            matching.save()

            # Logs the call.
            Call(
                caller=matching,
                time=now,
                blocked=matching.block
            ).save()

        # Number is blacklisted. Hangs up!
        if matching.block:
            logger.info(
                'Dropping call for BLOCKED number %s.' % str(matching))
            await self.modem.run_command_set(ModemType.DROP_CALL)
        else:
            logger.info('Call from %s ALLOWED.' % str(matching))
