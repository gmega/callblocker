#!/bin/sh

cd ${APP_FOLDER}

sh ./bin/wait-for.sh ${DB_HOST}:${DB_PORT:-5432} -t 1800 -- pytest