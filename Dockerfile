FROM python:3.6.8-alpine3.10

RUN apk add --virtual .build-deps \
    --no-cache \
    python3-dev \
    build-base \
    linux-headers \
    pcre-dev

RUN apk add --no-cache pcre postgresql-dev musl-dev

COPY . /callblocker

RUN pip install -r /callblocker/requirements.txt

RUN apk del .build-deps && rm -rf /var/cache/apk/*

ENV DJANGO_SETTINGS_MODULE=conf.settings.production

EXPOSE 5000
CMD ["uwsgi", "--ini", "/callblocker/conf/wsgi.ini"]