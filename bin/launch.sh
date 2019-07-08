#!/bin/sh

set -e

cd /callblocker

python -m callblocker.misc.preprocess ./callblocker/frontend/static/frontend

echo "Start UWSGI."

exec uwsgi --ini ./conf/wsgi.ini
