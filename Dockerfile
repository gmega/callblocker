# ==== Webpack Build
FROM node:12.5.0 as build

# We copy only the JS code to avoid needlessly running this stage for
# backend changes.
RUN mkdir -p /callblocker/frontend

COPY ./frontend/ /callblocker/frontend/
COPY package.json package-lock.json .babelrc webpack.config.js /callblocker/

# Install deps and builds the react client.
WORKDIR /callblocker
RUN npm install --silent
RUN npm run build-prod

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

COPY --from=build /callblocker/frontend/  /callblocker/frontend/

RUN pip install -r /callblocker/requirements.txt

RUN apk del .build-deps && rm -rf /var/cache/apk/*

EXPOSE 5000
CMD ["sh", "/callblocker/bin/launch.sh"]