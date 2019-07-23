// @flow

import {Response} from 'flow';
import type {Caller, CallerDelta} from './Caller';

import {camelize, snakeize} from './helpers';

export const API_PARAMETERS = {
  endpoint: 'http://localhost:8000/',
  pollingInterval: 1000
};

export const ERROR_TYPES = {
  server: 'server_error',
  network: 'network_error'
};

export function fetchCallers(
  opId: string,
  ordering: string,
  onSuccess: (callers: Array<Caller>) => void,
  onError: (opId: string, response: Response, errorType: string) => void = (opId, errorType, response) => undefined
) {
  fetch(`${API_PARAMETERS.endpoint}api/callers/?ordering=${ordering}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      onError(
        opId,
        response,
        ERROR_TYPES.server
      );
    })
    .then(apiCallers => {
      if (apiCallers) {
        onSuccess(apiCallers.map(fromAPIObject));
      }
    })
    .catch((reason) => onError(
      opId,
      reason, //FIXME this is not a Response
      ERROR_TYPES.network
    ));
}


export function patchCallers(
  opId: string,
  patches: Array<CallerDelta>,
  onSuccess: (opId: string, patches: Array<CallerDelta>) => void,
  onError: (key: string, response: Response, errorType: string) => void =
    (key: string, response: Response, errorType: string) => undefined
) {
  fetch(
    `${API_PARAMETERS.endpoint}api/callers/`,
    {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify(patches.map(toAPIObject)) // We don't do any verification here.
    })
    .then(response => {
      if (!response.ok) {
        onError(
          opId,
          response,
          ERROR_TYPES.server
        );
      } else {
        onSuccess(opId, patches);
      }
    }).catch((reason) => onError(
    opId,
    reason, //FIXME this is not a Response
    ERROR_TYPES.network
  ));
}


export function toAPIObject(caller: Caller | CallerDelta): Object {
  if (caller.original) {
    return snakeize({
      fullNumber: caller.original.fullNumber,
      ...caller
    })
  } else {
    return snakeize(caller);
  }
}

export function fromAPIObject(object: Object): Caller {
  // We trust the API not to screw up ;-)
  return (camelize(object): Caller);
}
