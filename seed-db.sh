#!/bin/sh
#
# Seeds the database with the base data required for Callblocker to function.

cd ${APP_FOLDER}

if [[ -e seed-mark ]]; then
    echo "Database already seeded."
    exit 0
fi

echo "Applying migrations."

python ./manage.py migrate

echo "Seeding database."

python ./manage.py loaddata ./callblocker/blocker/fixtures/initial.yaml

# On success, create marker.
touch seed-mark