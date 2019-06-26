from typing import Dict, Any

from django.db.models import Count
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView

from callblocker.blocker.api.serializers import CallerSerializer
from callblocker.blocker.models import Caller


class CallerList(ListAPIView):
    ALLOWED_ORDERINGS = frozenset(['calls', 'date_inserted'])
    DEFAULT_ORDERING = 'calls'

    serializer_class = CallerSerializer

    def get_queryset(self):
        args = self._get_params()

        queryset = Caller.objects.annotate(calls=Count('call'))

        # Filter out blocked or non-blocked numbers.
        if args.get('block_status') is not None:
            queryset = queryset.filter(block=args['block_status'])

        # Ordering.
        return queryset.order_by(args['ordering'])

    def _get_params(self) -> Dict[str, Any]:
        params = dict(self.request.query_params)
        params['ordering'] = params.get('ordering', CallerList.DEFAULT_ORDERING)
        if params['ordering'] not in CallerList.ALLOWED_ORDERINGS:
            raise ValidationError(detail='Ordering parameter must be one of: %s' %
                                         ','.join(CallerList.ALLOWED_ORDERINGS))

        return params
