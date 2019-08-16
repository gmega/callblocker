"""
WSGI config for callblocker project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/howto/deployment/wsgi/
"""

import os

from django.conf import settings
from django.core.wsgi import get_wsgi_application

from callblocker import blocker
from callblocker.blocker import BootstrapMode

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'conf.settings.production')

blocker.bootstrap_mode(
    BootstrapMode.FAKE_SERVER
    if settings.MODEM_USE_FAKE
    else BootstrapMode.SERVER
)

application = get_wsgi_application()
