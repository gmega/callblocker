from typing import Dict, Any

from django.db.models import Count
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_bulk import BulkUpdateModelMixin, BulkDestroyModelMixin

from callblocker.blocker.api.serializers import CallerSerializer
from callblocker.blocker.models import Caller
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


@api_view(['GET'])
def health_status(request):
    return Response(monitor().health())
