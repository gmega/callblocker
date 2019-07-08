from .base import *

ALLOWED_HOSTS = [environ['HOST_API_ADDRESS']]

CORS_ORIGIN_WHITELIST = ('http://%s:%s' % (environ['HOST_API_ADDRESS'], environ['HOST_API_PORT']), )


