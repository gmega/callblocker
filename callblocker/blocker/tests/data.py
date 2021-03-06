import random
from datetime import timedelta, datetime

import pytz
from yaml import dump, Dumper

NAMES = """Zed Albright
Marinda Stgeorge  
Kimberley Mccausland  
Fermin Shope  
Yoshiko Beahm  
Wayne Christiano  
Rubye Hartman  
Julienne Moniz  
Mardell Lesage  
Mack Oleson  
Alexis Broker  
Chara Spagnoli  
Arianne Dougan  
Sherill Ryan  
Lieselotte Strawder  
Veronique Carron  
Natividad Demay  
Migdalia Denney  
Tonita Pullin  
Dario Moorehead  
Cherly Horsman  
Dalia Hofer  
Delcie Austria  
Ramiro Mossman  
Elfriede Cesare  
Nia Quijada  
Janel Fabre  
Katherin Coca  
Olinda Soukup  
Kyla Osorio  
Reynalda Tinkham  
Cordia Keeney  
Liz Pion  
Bettie Kea  
Herbert Deibert  
Georgetta Frum  
Rafaela Mcnett  
Rosalind Mole  
Sherri Pharr  
Erin Wiedemann  
Thuy Rabideau  
Willene Hornbeck  
Joie Pinzon  
Makeda Jeremiah  
Dovie Lisby  
Darcel Dawes  
Margene Calzada  
Germaine Burbridge  
Lorri Buchman  
Arturo Landis  
Vern Murdock
""".splitlines(keepends=False)


def generate(caller_names, n_calls):
    callers = [
        generate_caller(name) for name in caller_names
    ]

    calls = []
    for caller in callers:
        calls.extend(
            generate_calls(random.randint(0, n_calls), caller, len(calls) + 1)
        )

    return dump(callers + calls, Dumper=Dumper)


def generate_caller(name):
    year = datetime.now().year

    area_code = integer_string(2)
    full_number = integer_string(8)

    instance = {
        'model': 'blocker.Caller',
        'pk': f'{area_code}{full_number}',
        'fields': {
            'area_code': area_code,
            'number': full_number,
            'date_inserted': gen_datetime(year),
            'last_call': gen_datetime(year),
            'block': random.random() < 0.5,
            'source': 1,
            'description': name.strip(),
            'notes': ''
        }
    }

    fields = instance['fields']
    # Django does not call Model#save on loaddata so we have to do this by hand.
    fields['full_number'] = fields['area_code'] + fields['number']

    return instance


def generate_calls(n, caller, call_pk_base):
    year = datetime.now().year
    return [
        {
            'model': 'blocker.Call',
            'pk': call_pk_base + i,
            'fields': {
                'caller': caller['pk'],
                'time': gen_datetime(year=year),
                'blocked': random.random() < 0.5
            }
        } for i in range(0, n)
    ]


def integer_string(n):
    return ''.join([str(random.randint(0, 9)) for _ in range(0, n)])


def gen_datetime(year, quoted=True):
    # generate a datetime in format yyyy-mm-dd hh:mm:ss.000000
    start = datetime.now()
    end = start - timedelta(days=365)
    dt = (start + (end - start) * random.random()).replace(tzinfo=pytz.utc)

    # Quoting to work around https://code.djangoproject.com/ticket/18867
    return dt.isoformat() if quoted else dt


print(generate(NAMES, 15))
