#!/bin/sh

cd ${APP_FOLDER}

sh ./bin/wait-for.sh ${DB_HOST}:${DB_PORT} -t 1800 -- pytest