import moment from "moment";

export function map(obj, fun) {
    return Object.entries(obj).reduce((obj, [key, value]) => {
        obj[key] = fun(key, value);
        return obj
    }, {})
}

export function filter(obj, predicate = (key, value) => true) {
    return Object.entries(obj)
        .filter(([key, value]) => predicate(key, value))
        .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {})
}

export const removeKey = (obj, key) => filter(obj, (akey, value) => akey !== key);

export function formatTime(callDate, now = null) {
    now = now ? now : moment();

    // Call happened this year.
    if (
        now.year() === callDate.year()
    ) {
        // Call happened this month.
        if (now.month() === callDate.month()) {
            // Call happened today.
            if (now.day() === callDate.day()) {
                return callDate.format('h:mm a');
            }
            // Return weekday, eventually.
        }
        return callDate.format('MMMM Do')
    }
    return callDate.format('MMMM Do YYYY')
}

export const camelize = (key) => caseize(key, camelizeKey);
export const snakeize = (key) => caseize(key, snakeizeKey);

function caseize(shallow_obj, caseizeKey) {
    return Object.entries(shallow_obj).reduce(
        (obj, [key, value]) => {
            obj[caseizeKey(key)] = value;
            return obj;
        },
        {}
    );
}

function camelizeKey(key) {
    return key.split('_').map(
        (part, index) => index ? part.replace(/^[a-z]/, (c) => c.toUpperCase()) : part
    ).join('');
}

function snakeizeKey(key) {
    return key.split(/(?=[A-Z])/).map((part) => part.toLowerCase()).join('_')
}

export function weakId() {
    // Got this from Github https://gist.github.com/6174/6062387. No analysis on collisions but I do not care.
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}