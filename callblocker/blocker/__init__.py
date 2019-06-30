
#: This is an ugly hack. See the blocker.bootstrap module documentation for more information.
BOOTSTRAP_CALLMONITOR = False


def enable():
    global BOOTSTRAP_CALLMONITOR
    BOOTSTRAP_CALLMONITOR = True
