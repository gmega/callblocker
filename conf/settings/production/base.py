from conf.settings.base import *

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'api': {
            'class': 'callblocker.core.logging.TailHandler',
            'tail_size': 100
        }
    },
    'root': {
        'handlers': ['console', 'api'],
        'level': 'INFO'
    }
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': environ['DB_NAME'],
        'USER': environ['DB_USER'],
        'PASSWORD': environ['DB_PASSWORD'],
        'HOST': environ['DB_HOST'],
        'PORT': environ['DB_PORT'],
        'CONN_MAX_AGE': DB_CONN_MAX_AGE
    }
}
