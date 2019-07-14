import {camelize, formatTime, map, removeKey, snakeize} from './helpers';
import moment from 'moment';

it('camelizes snake_case keys', () => {
    expect(
        camelize({oh_my_god_batman: 'value'})
    ).toStrictEqual(
        {ohMyGodBatman: 'value'}
    );
});

it('snakeizes CamelCase keys', () => {
    expect(
        snakeize({ohMyGodBerlusconi: 'value'})
    ).toStrictEqual(
        {oh_my_god_berlusconi: 'value'}
    );
});


const now = moment('2019-10-06T08:17:15.337318+00:00').utc();

it('shows the hour for same-day calls', () => {
    expect(
        formatTime(moment('2019-10-06T09:35:12.295838+00:00').utc(), now)
    ).toBe(
        '9:35 am'
    );

    expect(
        formatTime(moment('2019-10-06T21:35:12.295838+00:00').utc(), now)
    ).toBe(
        '9:35 pm'
    );
});

it('shows the day and month for same-year calls', () => {
    expect(
        formatTime(moment('2019-11-06T09:35:12.295838+00:00').utc(), now)
    ).toBe(
        'November 6th'
    );
});

it('shows month, day and year for all other calls', () => {
    expect(
        formatTime(moment('2018-11-06T09:35:12.295838+00:00').utc(), now)
    ).toBe(
        'November 6th 2018'
    )
});

it('transforms objects with map', () => {
    let anObject = {
        k1: 1,
        k2: 2,
        k3: 3,
        k4: 4
    };

    expect(
        map(anObject, (key, value) => value * 2)
    ).toStrictEqual(
        {k1: 2, k2: 4, k3: 6, k4: 8}
    )
});

it('removes keys from objects', () => {
    let anObject = {
        k1: 1,
        k2: 2,
        k3: 3,
        k4: 4
    };

    expect(
        removeKey(anObject, 'k1')
    ).toStrictEqual(
        {k2: 2, k3: 3, k4: 4}
    );

    expect(
        removeKey(anObject, 'k3')
    ).toStrictEqual(
        {k1: 1, k2: 2, k4: 4}
    );
});
