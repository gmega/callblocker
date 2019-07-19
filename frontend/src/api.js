// @flow

import {Response} from 'flow';
import type {Caller, CallerDelta} from './Caller';
import {fromAPIObject, toAPIObject} from './Caller';

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
      reason,
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
      ERROR_TYPES.network,
      reason
    ));
}