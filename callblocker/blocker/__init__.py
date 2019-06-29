# This is an ugly hack to avoid having the modem loop initializing on every
# command. Commands which need it bootstrapped should set the above global to True.
# Clearly I cannot put this in the bootstrap module as this has to be set prior to
# importing it.

BOOTSTRAP_CALLMONITOR = False


def enable():
    global BOOTSTRAP_CALLMONITOR
    BOOTSTRAP_CALLMONITOR = True
