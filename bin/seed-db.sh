#!/bin/sh
#
# Seeds the database with the base data required for Callblocker to function.

set -e

if [[ -e ${SEED_MARK_FOLDER}/seed-mark ]]; then
    echo "Database already seeded."
    exit 2
fi

cd ${APP_FOLDER}

echo "Applying migrations."

python ./manage.py migrate

echo "Seeding database."

python ./manage.py loaddata ./callblocker/blocker/fixtures/initial.yaml

if [[ "${LOAD_SAMPLE_DATA}" = "True" ]]; then
    echo "Loading sample data."
    python ./manage.py loaddata ./callblocker/blocker/fixtures/sample_data.yaml
fi

touch ${SEED_MARK_FOLDER}/seed-mark