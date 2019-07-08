#!/bin/sh
#
# Seeds the database with the base data required for Callblocker to function.

cd ${APP_FOLDER}

echo "Applying migrations."

python ./manage.py migrate

echo "Seeding database."

python ./manage.py loaddata ./callblocker/blocker/fixtures/initial.yaml
