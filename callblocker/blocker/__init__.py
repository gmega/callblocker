from enum import Enum

default_app_config = 'callblocker.blocker.apps.BlockerConfig'


class BootstrapMode(Enum):
    SERVER = 'server'
    FAKE_SERVER = 'fake_server'
    COMMAND = 'command'


#: This is an ugly hack. See the blocker.bootstrap module documentation for more information.
BOOTSTRAP_MODE: BootstrapMode = BootstrapMode.COMMAND


def bootstrap_mode(mode: BootstrapMode):
    global BOOTSTRAP_MODE
    BOOTSTRAP_MODE = mode
