import json

import pytest


@pytest.mark.django_db
def test_bulk_patch(api_client):
    callers = api_client.get('/api/callers/?limit=1000').json()['results']
    blocked_callers = [
        caller for caller in callers if caller['block']
    ]

    # For a bulk update we need at least two blocked callers!
    assert len(blocked_callers) > 2, 'Not enough blocked callers in test database.'

    response = api_client.patch(
        '/api/callers/',
        json.dumps([{
            'full_number': caller['full_number'],
            'block': False
        } for caller in blocked_callers]),
        content_type='application/json'
    )

    assert response.status_code == 200

    for blocked_caller in blocked_callers:
        response = api_client.get('/api/callers/%s.json' % blocked_caller['full_number']).json()
        assert response['block'] is False


@pytest.mark.django_db
def test_retrieves_calls(api_client):
    callers = api_client.get('/api/callers/?limit=1000').json()['results']
    caller_with_calls = next(
        caller for caller in callers if caller['calls'] > 1
    )

    assert len(caller_with_calls) > 0, 'There are no callers with more than one call in test database'

    caller_calls = api_client.get(
        f'/api/callers/{caller_with_calls["area_code"]}-{caller_with_calls["number"]}/calls/?limit=1000'
    ).json()['results']

    assert len(caller_calls) == caller_with_calls["calls"]

    for caller_call in caller_calls:
        assert caller_call["caller"] == caller_with_calls["full_number"]


