from callblocker.blocker import BOOTSTRAP_MODE, services


# This is an ugly hack. We need to start the modem monitoring loop when we run
# the Callblocker server, but we do not need to do that when running, say "loaddata" (i.e.
# it's weird to have loaddata fail because the modem is not attached to the server!).
# Since Django does not provide us with a sane way of running initialization code, however, the
# modem monitoring loop is currently initialized from a hardwired call inside of "urls.py", which was the
# only way I could get this darn thing working (and it's the method of choice for Django users, e.g.
# https://stackoverflow.com/questions/6791911/execute-code-when-django-starts-once-only). Note
# that AppConfig#ready, the hook Django provides, is called too early as we need access to model classes; i.e.,
# putting the code there results in an exception.
# The simplest solution is therefore to put a a "boot mode" here which is set early in the initialization process,
# but will materialize into actual services only here, when called by urls.py. Ugh.

def bootstrap():
    services.bootstrap(BOOTSTRAP_MODE.value)
