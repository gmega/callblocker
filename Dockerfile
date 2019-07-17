ARG APP_FOLDER_ARG=/callblocker

# ==== Webpack Build
FROM node:12.5.0 as build

ARG APP_FOLDER_ARG
ENV APP_FOLDER=${APP_FOLDER_ARG}

# We copy only the JS code to avoid needlessly running this stage for
# backend changes.
RUN mkdir -p ${APP_FOLDER}/frontend

COPY ./frontend/ ${APP_FOLDER}/frontend/
COPY package.json package-lock.json .babelrc webpack.config.js ${APP_FOLDER}/

# Install deps and builds the react client.
WORKDIR ${APP_FOLDER}
RUN npm install --silent
RUN npm run build-prod

# ==== Server Assembly
FROM python:3.6.8-alpine3.10

ARG APP_FOLDER_ARG
ENV APP_FOLDER=${APP_FOLDER_ARG}

RUN apk add --virtual .build-deps \
    --no-cache \
    python3-dev \
    build-base \
    linux-headers \
    pcre-dev

RUN apk add --no-cache pcre postgresql-dev musl-dev mailcap

# Copy requirements first to leverage caching and avoid rebuilding
# wheels every time.
COPY ./requirements.txt .${APP_FOLDER}/requirements.txt

RUN pip install -r ${APP_FOLDER}/requirements.txt

RUN apk del .build-deps && rm -rf /var/cache/apk/*

# Copies the source code.
COPY . ${APP_FOLDER}

# Copies the frontend from the previous build stage.
COPY --from=build ${APP_FOLDER}/frontend/  ${APP_FOLDER}/frontend/

# Wraps up collecting static assets from other apps (e.g. restframework).
WORKDIR ${APP_FOLDER}
RUN python ./manage.py collectstatic --settings conf.settings.base --noinput

# Good to go!
EXPOSE 5000
CMD sh ${APP_FOLDER}/bin/launch.sh