from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from rest_framework_bulk import BulkSerializerMixin

from callblocker.blocker.api.rest_framework_bulk import PatchedBulkListSerializer
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
    date_inserted = serializers.DateTimeField(read_only=True)
    last_call = serializers.DateTimeField(read_only=True)
    calls = serializers.IntegerField(read_only=True)
    text_score = serializers.FloatField(read_only=True)

    class Meta:
        list_serializer_class = PatchedBulkListSerializer
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
            'calls',
            'text_score'
        ]
