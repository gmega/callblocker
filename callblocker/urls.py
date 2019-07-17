"""callblocker URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import logging

from django.conf import settings
from django.conf.urls import url
from django.contrib import admin
from django.urls import path, include
from rest_framework_bulk.routes import BulkRouter

from callblocker.blocker import bootstrap
from callblocker.blocker.api import views as api_views

bulk_router = BulkRouter()
bulk_router.register(
    r'callers',
    api_views.CallerViewSet,
    basename='caller'
)

urlpatterns = [
    url(r'^api/', include(bulk_router.urls)),
    path('api/status/', api_views.health_status),
    path('admin/', admin.site.urls)
]

if settings.MODEM_DEBUG:
    urlpatterns += [
        path('api/modem/', api_views.modem)
    ]

# Oh, Django... why do you make me do this?
bootstrap.bootstrap_callmonitor_noexc()
