export const API_PARAMETERS = {
    endpoint: 'http://localhost:8000/',
    pollingInterval: 1000
};

export const ERROR_TYPES = {
    server: 'server_error',
    network: 'network_error'
};


export function fetchCallers(opId, ordering, onSuccess, onError = (opId, errorType, response) => null) {
    fetch(`${API_PARAMETERS.endpoint}api/callers/?ordering=${ordering}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            onError(
                opId,
                ERROR_TYPES.server,
                response
            );
        })
        .then(callers => onSuccess(callers))
        .catch((reason) => onError(
            opId,
            ERROR_TYPES.network,
            reason
        ));
}

export function patchCallers(opId, patches, onSuccess, onError = (key, response, message) => null) {
    fetch(
        `${API_PARAMETERS.endpoint}api/callers/`,
        {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'PATCH',
            body: JSON.stringify(patches) // We don't do any verification here.
        })
        .then(response => {
            if (!response.ok) {
                onError(
                    opId,
                    ERROR_TYPES.server,
                    response
                );
            } else {
                onSuccess(opId, patches);
            }
        }).catch((reason) => onError(
            opId,
            ERROR_TYPES.network,
            reason
        ));
}