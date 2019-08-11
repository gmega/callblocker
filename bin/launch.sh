#!/bin/sh

set -e

cd ${APP_FOLDER}

echo "Start UWSGI."

exec uwsgi --ini ./conf/wsgi.ini
