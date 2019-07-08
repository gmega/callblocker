# ==== Webpack Build
FROM node:12.5.0 as build

# We keep this structure to avoid having to change the webpack build. This
# callblocker/callblocker is just how Django likes things organized.
RUN mkdir -p /callblocker/callblocker/frontend
RUN mkdir -p /callblocker/callblocker/frontend/static/frontend

COPY ./callblocker/frontend/src /callblocker/callblocker/frontend/src
COPY package.json package-lock.json .babelrc webpack.config.js /callblocker/

# Install deps and builds the react client.
WORKDIR /callblocker
RUN npm install --silent
RUN npm run build

# ==== Server Assembly
FROM python:3.6.8-alpine3.10

RUN apk add --virtual .build-deps \
    --no-cache \
    python3-dev \
    build-base \
    linux-headers \
    pcre-dev

RUN apk add --no-cache pcre postgresql-dev musl-dev mailcap

COPY . /callblocker

COPY --from=build /callblocker/callblocker/frontend/static/frontend  /callblocker/callblocker/frontend/static/frontend

RUN pip install -r /callblocker/requirements.txt

RUN apk del .build-deps && rm -rf /var/cache/apk/*

EXPOSE 5000
CMD ["sh", "/callblocker/bin/launch.sh"]