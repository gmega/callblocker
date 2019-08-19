from functools import reduce

from rest_framework.exceptions import ValidationError
from rest_framework.fields import SkipField, Field, ChoiceField
from rest_framework.serializers import Serializer
from rest_framework.settings import api_settings
from rest_framework.utils import html
from rest_framework_bulk import BulkListSerializer


# We have to patch BulkListSerializer to deal with https://github.com/miki725/django-rest-framework-bulk/issues/68
# This may break with newer versions of restframework, so it would be nice to get rid of it, eventually.


class PatchedBulkListSerializer(BulkListSerializer):
    def to_internal_value(self, data):
        """
        List of dicts of native values <- List of dicts of primitive datatypes.
        """
        if html.is_html_input(data):
            data = html.parse_html_list(data, default=[])

        if not isinstance(data, list):
            message = self.error_messages['not_a_list'].format(
                input_type=type(data).__name__
            )
            raise ValidationError({
                api_settings.NON_FIELD_ERRORS_KEY: [message]
            }, code='not_a_list')

        if not self.allow_empty and len(data) == 0:
            if self.parent and self.partial:
                raise SkipField()

            message = self.error_messages['empty']
            raise ValidationError({
                api_settings.NON_FIELD_ERRORS_KEY: [message]
            }, code='empty')

        ret = []
        errors = []

        id_attr = getattr(self.child.Meta, 'update_lookup_field', 'id')

        for item in data:
            try:
                # --------------------- patched pieces --------------------------------
                self.child.instance = self.instance.get(**{id_attr: item.get(id_attr)})
                self.child.initial_data = item
                # ---------------------------------------------------------------------
                validated = self.child.run_validation(item)
            except ValidationError as exc:
                errors.append(exc.detail)
            else:
                ret.append(validated)
                errors.append({})

        if any(errors):
            raise ValidationError(errors)

        return ret


class EnumField(ChoiceField):
    def __init__(self, enum, **kwargs):
        self.enum = enum
        kwargs['choices'] = [(e.value, e.name) for e in enum]
        super(EnumField, self).__init__(**kwargs)

    def to_representation(self, obj):
        return obj.name

    def to_internal_value(self, data):
        try:
            return self.enum[data]
        except KeyError:
            self.fail('invalid_choice', input=data)


class GeneratedCharField(Field):

    def __init__(self, fields, fun=lambda x, y: x + y, **kwargs):
        self.fields = fields
        self.fun = fun
        # Generated fields are never required. In fact they should not be present
        # in the data.
        kwargs['required'] = False
        super().__init__(**kwargs)

    def get_value(self, dictionary):
        return {
            key: dictionary.get(key)
            for key in self.fields
        }

    def to_internal_value(self, data):
        values = []
        for field in self.fields:
            value = data.get(field)
            if not isinstance(value, str):
                raise ValidationError(f'Field {field} must be a string but is a {str(type(value))}')
            values.append(value)

        return reduce(self.fun, values, '')

    def to_representation(self, value):
        return value


class ExceptionField(Field):
    def __init__(self, **kwargs):
        # Our typical use case for Exceptions is reporting. Clients are not usually
        # allowed to set them.
        kwargs['read_only'] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        # Well... can't get any simpler than this.
        return f'{type(value).__name__}: {str(value)}'


class ROSerializer(Serializer):
    def create(self, validated_data):
        raise NotImplemented('Cannot create readonly objects.')

    def update(self, instance, validated_data):
        raise NotImplemented('Cannot update readonly objects.')
