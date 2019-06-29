from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

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


class CallerSerializer(ModelSerializer):
    calls = serializers.IntegerField(read_only=True)

    class Meta:
        model = Caller
        fields = [
            'area_code',
            'number',
            'block',
            'date_inserted',
            'description',
            'notes',
            'source',
            'calls'
        ]
