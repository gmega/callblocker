from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

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
        'PORT': '5432'
    }
}

MODEM_USE_FAKE = bool_env('MODEM_USE_FAKE', 'True')
MODEM_DEBUG = True
