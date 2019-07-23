import asyncio
from typing import Dict, Any

from django.db.models import Count
from rest_framework.decorators import api_view, parser_classes
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import RetrieveModelMixin, ListModelMixin
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_202_ACCEPTED
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework_bulk import BulkUpdateModelMixin, BulkDestroyModelMixin

from callblocker.blocker import bootstrap
from callblocker.blocker.api.serializers import CallerSerializer, CallSerializer
from callblocker.blocker.models import Caller, Call
from callblocker.core.healthmonitor import monitor


class CallerViewSet(ModelViewSet, BulkUpdateModelMixin, BulkDestroyModelMixin):
    ALLOWED_ORDERINGS = frozenset(['calls', 'date_inserted', 'last_call'])
    DEFAULT_ORDERING = ['calls']

    serializer_class = CallerSerializer
    pagination_class = LimitOffsetPagination
    lookup_value_regex = r'(?P<full_number>[0-9\-]+)'

    def get_queryset(self):
        args = self._get_params()

        queryset = Caller.objects.annotate(calls=Count('call'))

        # Filter out blocked or non-blocked numbers.
        if args.get('block_status') is not None:
            queryset = queryset.filter(block=args['block_status'])

        # Ordering.
        return queryset.order_by('-%s' % args['ordering'])

    def get_object(self):
        full_number = self.kwargs['full_number'].replace('-', '')

        obj = get_object_or_404(
            queryset=self.get_queryset(),
            full_number=full_number
        )

        self.check_object_permissions(self.request, obj)
        return obj

    def _get_params(self) -> Dict[str, Any]:
        params = dict(self.request.query_params)
        params['ordering'] = params.get('ordering', CallerViewSet.DEFAULT_ORDERING)[0]
        if params['ordering'] not in CallerViewSet.ALLOWED_ORDERINGS:
            raise ValidationError(detail='Ordering parameter must be one of: %s' %
                                         ','.join(CallerViewSet.ALLOWED_ORDERINGS))

        return params


class CallViewSet(RetrieveModelMixin, ListModelMixin, BulkDestroyModelMixin, GenericViewSet):
    serializer_class = CallSerializer
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        full_number = self.kwargs['full_number'].replace('-', '')
        return Call.objects.filter(caller__full_number=full_number)


@api_view(['GET'])
def health_status(request):
    return Response(monitor().health())


@api_view(['POST'])
@parser_classes((JSONParser,))
def modem(request):
    data = request.data
    command = data.get('command')
    if not command:
        return Response(data={'error': 'command missing'}, status=HTTP_400_BAD_REQUEST)

    the_modem = bootstrap.modem()
    asyncio.run_coroutine_threadsafe(the_modem.async_command(command), loop=the_modem.aio_loop)

    return Response(status=HTTP_202_ACCEPTED)
