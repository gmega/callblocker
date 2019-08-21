import sys

from callblocker.core.modem import ModemType

#: Definitions for Conexant CX930xx-based modems.
CX930xx = ModemType(
    encoding='ASCII',
    newline=b'\r',
    command_timeout=2,
    commands={
        ModemType.INIT: [
            'ATE0',
            'ATZ',
            'AT+VCID=1'
        ],
        ModemType.DROP_CALL: [
            'ATH1',
            '#PAUSE',
            '#PAUSE',
            'ATH0'
        ]
    }
)


def get_modem(modem_type: str):
    return getattr(sys.modules[__name__], modem_type)
