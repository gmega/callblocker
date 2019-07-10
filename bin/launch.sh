#!/bin/sh

set -e

cd /callblocker

python -m callblocker.misc.preprocess ./frontend/dist

echo "Start UWSGI."

exec uwsgi --ini ./conf/wsgi.ini
