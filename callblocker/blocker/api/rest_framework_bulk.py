from rest_framework.exceptions import ValidationError
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
