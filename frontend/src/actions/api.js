// @flow

import {Promise, Response} from 'flow';
import {Dispatch} from 'react-redux';

import {camelize, snakeize} from '../helpers';
import type {Call, Caller, CallerDelta, NewCaller} from '../types/domainTypes';
import {reportStatus} from './status';

export const API_PARAMETERS = {
  endpoint: 'http://localhost:8000/',
  pollingInterval: 1000
};

export const CALLERS_FETCH_SUCCESS = 'CALLERS_FETCH_SUCCESS';
export type CallersFetchSuccess = {|
  type: 'CALLERS_FETCH_SUCCESS',
  callers: Array<Caller>;
|};

export const callersFetchSuccess = (callers: Array<Caller>) => ({
  type: CALLERS_FETCH_SUCCESS,
  callers: callers
}: CallersFetchSuccess);

export const CALLS_FETCH_SUCCESS = 'CALLS_FETCH_SUCCESS';
export type CallsFetchSuccess = {|
  type: 'CALLS_FETCH_SUCCESS',
  caller: Caller,
  calls: Array<Call>;
|}

export const callsFetchSuccess = (caller: Caller, calls: Array<Call>) => ({
  type: CALLS_FETCH_SUCCESS,
  caller: caller,
  calls: calls
}: CallsFetchSuccess);

export const CLEAR_CACHE = 'CLEAR_CACHE';
export type ClearCache = {|
  type: 'CLEAR_CACHE'
|}

export const clearCache = () => ({
  type: 'CLEAR_CACHE'
}: ClearCache);

export type ApiAction =
  CallersFetchSuccess |
  CallsFetchSuccess |
  ClearCache;

const ERROR_TYPES = {
  response: 'response',
  reject: 'reject'
};

const ERROR_MESSAGES = {
  'fetchCallers': {
    [ERROR_TYPES.reject]: (response) => 'Failed to fetch caller list from backend server. Retrying...',
    [ERROR_TYPES.response]: (response) =>
      `Failed to fetch items from backend server: (${response.message})`
  },
  'patchCallers': {
    [ERROR_TYPES.reject]: (response) => 'Update operation failed (network error).',
    [ERROR_TYPES.response]: (response) =>
      `Update operation failed: ${response.message}`
  }
};

export function createCaller(caller: NewCaller) {
  return (dispatch: Dispatch) =>
    writeObjects(
      fetch(
        `${API_PARAMETERS.endpoint}api/callers/`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(toAPIObject(caller))
        }
      ),
      'createCaller',
      'Caller added successfully.',
      dispatch
    )
}

export function fetchCallers(
  ordering: 'last_call' | 'calls' | 'date_inserted' | 'description' | 'text_score' = 'last_call',
  text: ?string
) {
  return (dispatch: Dispatch) =>
    fetchObjects(
      fetch(`${API_PARAMETERS.endpoint}api/callers/?ordering=${ordering}${text ? `&text=${text}` : ''}`),
      'fetchCallers',
      (object: Object) => (camelize(object): Caller),
      (callers) => dispatch(callersFetchSuccess(callers)),
      dispatch
    );
}

export function patchCallers(
  patches: Array<CallerDelta>
): Promise<Response> {
  return (dispatch: Dispatch) =>
    writeObjects(
      fetch(
        `${API_PARAMETERS.endpoint}api/callers/`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'PATCH',
          body: JSON.stringify(patches.map(toAPIObject)) // We don't do any verification here.
        }
      ),
      'patchCallers',
      `${patches.length} item(s) updated successfully.`,
      dispatch
    );
}

export function fetchCalls(
  caller: Caller
): Promise<Response> {
  return (dispatch: Dispatch) =>
    fetchObjects(
      fetch(
        `${API_PARAMETERS.endpoint}api/callers/${caller.areaCode}-${caller.number}/calls/`
      ),
      'fetchCalls',
      (object: Object) => (camelize(object): Call),
      (calls) => dispatch(callsFetchSuccess(caller, calls)),
      dispatch
    )
}

function fetchObjects<I, R>(
  requestPromise: Promise,
  operationId: string,
  mapResponse: (jsonResponse: Object) => R,
  onSuccess: (objects: Array<R>) => void,
  dispatch: Dispatch
): Promise<Response> {
  return requestPromise
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        dispatch(reportStatus(
          operationId,
          ERROR_MESSAGES[operationId][ERROR_TYPES.response](response),
          false,
          3000
        ));
      }
    })
    .then(data => {
      if (data) {
        onSuccess(data.map(mapResponse));
      }
    })
    .catch(reason =>
      dispatch(reportStatus(
        operationId,
        ERROR_MESSAGES[operationId][ERROR_TYPES.reject](reason),
        false,
        3000
      ))
    );
}

function writeObjects(
  requestPromise: Promise,
  operationId: string,
  successMessage: string,
  dispatch: Dispatch
): Promise<Response> {
  return requestPromise
    .then(response => {
      if (!response.ok) {
        dispatch(reportStatus(
          operationId,
          `Update failed (${response.message}).`,
          false,
          3000
        ));
      } else {
        dispatch(reportStatus(
          operationId,
          successMessage,
          true,
          3000
        ));
      }
    })
    .catch(
      reason =>
        dispatch(reportStatus(
          operationId,
          `Update failed (network error?).`,
          false,
          3000
        ))
    );
}

export function toAPIObject(caller: Caller | CallerDelta | NewCaller | Call): Object {
  if (caller.original) {
    return snakeize({
      fullNumber: caller.original.fullNumber,
      ...caller
    })
  } else {
    return snakeize(caller);
  }
}
