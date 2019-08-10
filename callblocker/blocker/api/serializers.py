from rest_framework import serializers
from rest_framework.relations import HyperlinkedRelatedField
from rest_framework.serializers import ModelSerializer, HyperlinkedModelSerializer
from rest_framework.validators import UniqueValidator
from rest_framework_bulk import BulkSerializerMixin

from callblocker.blocker.api.serializer_extensions import GeneratedCharField, PatchedBulkListSerializer
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


# We use two separate serializers for Caller:
#
#  * CallerSerializer, which is used for GET, PUT, PATCH and DELETE operations;
#  * CallerPOSTSerializer, which is used for POST operations.
#
# The main reason for this is because we do not want to allow primary keys to be
# edited with PUT and PATCH, but we do want them to be set with POST. With restframework,
# it appears that the easiest way to accomplish that is by defining separate serializers
# and then dispatch based on the verb.

class CallerSerializer(HyperlinkedModelSerializer, BulkSerializerMixin):
    calls = serializers.IntegerField(read_only=True)
    text_score = serializers.FloatField(read_only=True)

    class Meta:
        list_serializer_class = PatchedBulkListSerializer
        update_lookup_field = 'full_number'

        model = Caller
        fields = [
            # full_number may look redundant, but having it here allows us to leverage
            # restframework serializer validation without doing customizations.
            'full_number',
            'area_code',
            'number',
            'block',
            'date_inserted',
            'last_call',
            'description',
            'notes',
            'source',
            'calls',
            'text_score'
        ]

        read_only_fields = [
            'area_code',
            'number',
            'date_inserted',
            'last_call'
        ]


class CallerPOSTSerializer(ModelSerializer):
    full_number = GeneratedCharField(
        ['area_code', 'number'],
        validators=[UniqueValidator(queryset=Caller.objects.all())]
    )

    source = HyperlinkedRelatedField(
        default=None,
        view_name='source-detail',
        queryset=Source.objects.all()
    )

    class Meta:
        model = Caller
        fields = [
            'full_number',
            'area_code',
            'number',
            'block',
            'description',
            'notes',
            'source'
        ]

    def create(self, validated_data):
        # Ideally we'd have this as a default in HyperlinkedRelatedField above, but
        # then some weird stuff will happen as Django tries to access the database
        # at class definition time.
        if validated_data.get('source') is None:
            validated_data['source'] = Source.predef_source(Source.USER)
        return super().create(validated_data)
