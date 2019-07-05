from os import environ

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

CORS_ORIGIN_ALLOW_ALL = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG'
    },
    'callblocker.core': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'django.db.backends': {
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
        'HOST': 'localhost',
        'PORT': '5432'
    }
}
