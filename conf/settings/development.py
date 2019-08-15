from callblocker.core.tests.utils import local_ip_addresses
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# For development, we allow all local addresses we can muster.
ALLOWED_HOSTS = ['localhost', '0.0.0.0'] + local_ip_addresses()

CORS_ORIGIN_ALLOW_ALL = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[django] {levelname} {asctime} {module} {message}',
            'style': '{'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG'
    }
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'blocker',
        'USER': 'devel',
        'PASSWORD': 'devel',
        'HOST': environ.get('DB_HOST', 'localhost'),
        'PORT': '5432',
        'CONN_MAX_AGE': DB_CONN_MAX_AGE
    }
}

MODEM_USE_FAKE = bool_env('MODEM_USE_FAKE', 'True')
MODEM_DEBUG = True
