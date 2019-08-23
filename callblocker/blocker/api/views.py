import asyncio
from typing import Dict, Any

from django.contrib.postgres.search import TrigramSimilarity
from django.db.models import Count, Value, FloatField
from django.db.models import Q
from django.db.models.functions import Greatest, Lower
from django.http import Http404
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import RetrieveModelMixin, ListModelMixin
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_202_ACCEPTED, HTTP_200_OK
from rest_framework.viewsets import ModelViewSet, GenericViewSet, ViewSet
from rest_framework_bulk import BulkUpdateModelMixin, BulkDestroyModelMixin

from callblocker.blocker.api.exceptions import BadRequest400
from callblocker.blocker.api.serializers import CallerSerializer, CallSerializer, CallerPOSTSerializer, \
    SourceSerializer, ServiceSerializer
from callblocker.blocker.models import Caller, Call, Source
from callblocker.blocker.services import services
from callblocker.core.logging import tail
from callblocker.core.service import ServiceState


class CallerViewSet(ModelViewSet, BulkUpdateModelMixin, BulkDestroyModelMixin):
    ALLOWED_ORDERINGS = frozenset(['description', 'calls', 'date_inserted', 'last_call', 'text_score'])

    ORDERING_CONFIG = {
        'description': {
            'multiple': True,
            'ordering_field': ['no_description', 'description_ci']
        },
        'last_call': {
            'multiple': True,
            'ordering_field': ['no_last_call', '-last_call']
        }
    }

    DEFAULT_ORDERING = ['last_call']

    pagination_class = LimitOffsetPagination
    lookup_value_regex = r'(?P<full_number>[0-9\-]+)'

    def get_serializer_class(self):
        # Dispatch to the right serializer based on the verb.
        return (
            CallerSerializer if self.request.method != 'POST' else CallerPOSTSerializer
        )

    def get_queryset(self):
        args = self._get_params()
        return self._order(
            self._text_query(
                self._filter_blocked(
                    Caller.objects.annotate(
                        calls=Count('call'),
                        description_ci=Lower('description')
                    ).extra(
                        select={
                            'no_last_call': 'last_call is null',
                            'no_description': 'description = \'\''
                        }
                    ), args
                ), args
            ), args
        )

    @staticmethod
    def _text_query(queryset, args):
        text = args.get('text')
        if not text:
            # If no text search, annotates text_score with a 0.0 so that the serializer won't complain.
            # This is because restframework has no optional fields by design:
            #
            #   https://github.com/encode/django-rest-framework/issues/988
            #
            # and dealing with them in our context would just be a complexity hassle.
            return queryset.annotate(text_score=Value(0.0, output_field=FloatField()))

        text = text[0]
        return (
            queryset.filter(
                Q(full_number__trigram_similar=text) |
                Q(description__trigram_similar=text)
            ).annotate(
                # We just take the most similar field. Hopefully this will cut it.
                text_score=Greatest(TrigramSimilarity('full_number', text), TrigramSimilarity('description', text))
            )
        )

    @staticmethod
    def _order(queryset, args):
        # Ordering.
        ordering = args['ordering']

        # By default, we order on the field with the same name as the ordering,
        # in descending order.
        info = CallerViewSet.ORDERING_CONFIG.get(ordering, {})
        field = info.get('ordering_field', ordering)
        ascending = info.get('ascending', False)
        multiple = info.get('multiple', False)

        return (
            queryset.order_by(f'{"-" if not ascending else ""}{field}') if not multiple
            else queryset.extra(order_by=field)
        )

    @staticmethod
    def _filter_blocked(queryset, args):
        return queryset.filter(block=args['block_status']) \
            if args.get('block_status') is not None else queryset

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
        return Call.objects.filter(caller__full_number=full_number).order_by('-time')


class SourceViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    serializer_class = SourceSerializer
    queryset = Source.objects.all()


class ServicesViewset(ViewSet):
    serializer_class = ServiceSerializer
    parser_classes = [JSONParser]

    # The user can either start or terminate a service. Nothing else.
    ALLOWED_TARGET_STATES = [ServiceState.READY, ServiceState.TERMINATED]

    def list(self, _):
        return Response(ServiceSerializer(instance=services().services, many=True).data)

    def retrieve(self, _, pk):
        service = self._get_service_or_404(pk)
        return Response(ServiceSerializer(instance=service).data)

    def partial_update(self, request, pk):
        service = self._get_service_or_404(pk)
        data = request.data

        try:
            target = self._get_element_or_400(data, 'status', 'state')
            target = ServiceState[target.upper()]
        except KeyError:
            return Response(f'Invalid target state {target}.', status=status.HTTP_400_BAD_REQUEST)

        if target not in self.ALLOWED_TARGET_STATES:
            return Response(f'Cannot set service to {target}.')

        # Either start or stop.
        if target == ServiceState.READY:
            service.start()
        elif target == ServiceState.TERMINATED:
            service.stop()
        else:
            # Should never happen.
            raise Exception(f'Bad target state {target}.')

        return Response(status=status.HTTP_202_ACCEPTED)

    def _get_element_or_400(self, content, *path):
        element = path[0]
        if element not in content:
            raise BadRequest400(detail=f'Missing element {element} in {str(content)}')
        return self._get_element_or_400(content[element], *path[1:]) if len(path) > 1 else content[element]

    def _get_service_or_404(self, pk):
        service = getattr(services(), pk, None)
        if service is None:
            raise Http404(f'No services match {pk}.')
        return service


@api_view(['GET'])
def log(request):
    return Response(data=tail(), status=HTTP_200_OK)


@api_view(['POST'])
@parser_classes((JSONParser,))
def modem(request):
    data = request.data
    command = data.get('command')
    if not command:
        return Response(data={'error': 'command missing'}, status=HTTP_400_BAD_REQUEST)

    the_modem = services().modem
    asyncio.run_coroutine_threadsafe(the_modem.async_command(command), loop=the_modem.aio_loop)

    return Response(status=HTTP_202_ACCEPTED)
