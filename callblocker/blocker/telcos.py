import logging

import sys

from callblocker.blocker.callmonitor import TelcoProvider, CIDParseError
from callblocker.blocker.models import Caller, Source

logger = logging.getLogger(__name__)


class Vivo(TelcoProvider):
    """
      A provider which works on `Vivo <https://www.vivo.com.br>` CID strings.

      Vivo CID strings are of the form:

         [Operator Code]*[Area Code][8-or-9-digit Phone Number]

      The [Operator Code] is not always present, and I wouldn't know if their
      length is fixed or not. The [Area Code] of length 2 seems to be always present,
      as does the [Phone Number], but it is of variable length: 9 digits for
      numbers starting with "9" (mobile numbers), and 8 digits for other numbers.

      We therefore assume that:

        * the last 8 digits always belong to the phone number;
        * if the 9-th digit from the last is a "9" we will deduce this is a cellphone number, except
          when the CID string has 10 characters. This would make the area code; which
          has 2 digits and is always present, too short.

       everything that is left after extracting the phone number and the area code
       suffixes is considered to be operator code and therefore thrown away (not useful
       for identifying the caller).

    """

    MOBILE_BOUNDARY = -9
    LANDLINE_BOUNDARY = -8
    AREA_CODE_LENGTH = 2
    OPERATOR_CODE_LENGTH = 2

    def parse_cid(self, cid_string: str) -> Caller:
        if len(cid_string) < 10:
            raise CIDParseError('CID string too short for Vivo', cid_string)

        boundary = self.MOBILE_BOUNDARY if cid_string[-9] == '9' else self.LANDLINE_BOUNDARY

        rest, number = self._isplit(cid_string, boundary)
        rest, area_code = self._isplit(rest, -self.AREA_CODE_LENGTH)

        # Report the weirdness so we can improve things.
        if len(rest) > self.OPERATOR_CODE_LENGTH:
            logger.warning('Operator code too long in CID string %s' % cid_string)

        return Caller(
            number=number,
            area_code=area_code,
            source=Source.predef_source(Source.CID),
            block=False
        )

    def _isplit(self, string: str, index: int):
        return string[:index], string[index:]


def get_telco(telco: str):
    return getattr(sys.modules[__name__], telco)
