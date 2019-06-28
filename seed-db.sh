#!/bin/sh
cd /callblocker

if [[ -e seeded ]]; then
    echo "Database already seeded."
    exit 0
fi

echo "Seeding database."

touch seed-mark
python ./manage.py loaddata ./callblocker/blocker/fixtures/initial.yaml