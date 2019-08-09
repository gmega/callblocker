from .base import *

ALLOWED_HOSTS = environ['HOST_API_ADDRESSES'].split(',')

CORS_ORIGIN_WHITELIST = tuple('http://%s:%s' % (address, environ['HOST_API_PORT']) for address in ALLOWED_HOSTS)
