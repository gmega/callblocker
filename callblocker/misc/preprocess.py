"""
This simple script replaces the API endpoint inside of the client's JS file with the current known
API endpoint, _à la_ sed. This may look crude, but...

... our client-server system exposes a service in the local area network. The client part is a
JS/react client, whereas the server part is an HTTP REST API. The JS client has no way to
access any service discovery API I know of, and all I could find is a draft spec from Mozilla
(https://flyweb.github.io/) that is, well, a draft spec. mDNS is also not an option as the browser
cannot access that. Finally, we certainly cannot count on the API host having a DNS entry we can
use.

The only option is, therefore, to pass the IP address of the API server when serving the client for the first
time. We could do that by using a Jinja template, but it would mean Django would have to serve a
16 MB file while in single-process mode. Or we could use a constant in the sources, but that would mean
rerunning webpack compilation every time the server changes address.

We therefore do something simpler: we replace the IP of the development endpoint (localhost:8000)
with the actual server IP address on-the-fly inside of the compiled client's file as the server starts.
Every time. This has two obvious drawbacks:

  1. we can only serve requests from *ONE* IP address;
  2. the user has to tell us which on startup.

If I can figure out how to capture this information from UWSGI or nginx on-the-fly in the future, I'll change this
accordingly. For now it's a simple solution that works.
"""

import sys
from os import path, environ
from shutil import copyfile


def main(base, api_endpoint):
    if not path.exists(path.join(base, 'index_bundle.js.orig')):
        print('Store client template.')
        copyfile(path.join(base, 'index_bundle.js'), path.join(base, 'index_bundle.js.orig'))

    contents = open(path.join(base, 'index_bundle.js.orig'), encoding='utf-8').read()

    with open(path.join(base, 'index_bundle.js'), 'w', encoding='utf-8') as outfile:
        print('API server is %s.' % api_endpoint)
        outfile.write(contents.replace('localhost:8000', api_endpoint))


if __name__ == '__main__':
    main(sys.argv[1], '%s:%s' % (environ['HOST_API_ADDRESS'], environ['HOST_API_PORT']))
