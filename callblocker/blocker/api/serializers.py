from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from rest_framework_bulk import BulkSerializerMixin, BulkListSerializer

from callblocker.blocker.models import Call, Source, Caller


class CallSerializer(ModelSerializer):
    class Meta:
        model = Call
        fields = [
            'caller',
            'time',
            'blocked'
        ]


class SourceSerializer(ModelSerializer):
    class Meta:
        model = Source
        fields = [
            'name',
            'description'
        ]


class CallerSerializer(ModelSerializer, BulkSerializerMixin):
    area_code = serializers.CharField(read_only=True)
    number = serializers.CharField(read_only=True)
    calls = serializers.IntegerField(read_only=True)

    class Meta:
        list_serializer_class = BulkListSerializer
        update_lookup_field = 'full_number'

        model = Caller
        fields = [
            'area_code',
            'number',
            'full_number',  # returned for consistency
            'block',
            'date_inserted',
            'last_call',
            'description',
            'notes',
            'source',
            'calls'
        ]
