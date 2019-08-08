// @flow

import {Promise, Response} from 'flow';
import React from "react";
import {Dispatch} from 'react-redux';

import {camelize, snakeize} from '../helpers';
import type {Call, Caller, CallerDelta, NewCaller} from '../types/domainTypes';

// ------------------- API config parameters ----------------------------------

export const API_PARAMETERS = {
  endpoint: 'http://localhost:8000/',
  pollingInterval: 1000
};

// --------------------- Async Requests ---------------------------------------

export const PENDING = 'PENDING';
export type PendingAsyncRequest<Input> = {|
  status: 'PENDING',
  source: Input
|}

export const COMPLETE = 'COMPLETE';
export type CompletedAsyncRequest<Input, Output> = {|
  status: 'COMPLETE',
  source: Input,
  outcome: Success<Output> | Failure
|}

export const SUCCESS = 'SUCCESS';
export type Success<T> = {|
  type: 'SUCCESS',
  payload: T
|};

export const FAILURE = 'FAILURE';
export type Failure = {|
  type: 'FAILURE',
  retry: boolean,
  reason: string
|}

export type AsyncRequest<Input, Output> =
  PendingAsyncRequest<Input> |
  CompletedAsyncRequest<Input, Output>;

// Statuses help us format messages when AsyncRequests either fail or succeed. Success messages
// are optional, but failure messages are not.
export type StatusMessageFormatter<Input, Output> = {|
  success?: {|
    message: (input: Input, output: Output) => string,
    displayFor?: number
  |},
  failure: {|
    message: (input: Input, reason: string) => string,
    displayFor?: number
  |}
|}

export type FormatterRegistry = { [string]: StatusMessageFormatter<any, any> }
export const FORMATTERS = ({}: FormatterRegistry);

export type GenericApiRequest<Type, Input, Output> = {
  type: Type,
  ...AsyncRequest<Input, Output>
};

// --------------------------------- Fetch Actions ----------------------------

export const FETCH_CALLERS = 'FETCH_CALLERS';
FORMATTERS[FETCH_CALLERS] = ({
  success: undefined,
  failure: {
    message: (input: void, reason: string) => `Error fetching caller list from backend server (${reason}).`
  }
}: StatusMessageFormatter<void, Array<Caller>>);
export type FetchCallersRequest = GenericApiRequest<'FETCH_CALLERS', void, Array<Caller>>;

export const FETCH_CALLS = 'FETCH_CALLS';
FORMATTERS[FETCH_CALLS] = ({
  success: undefined,
  failure: {
    message: (input: Caller, reason: string) => `Error fetching calls for ${input.fullNumber} (${reason}).`
  }
});
export type FetchCallsRequest = GenericApiRequest<'FETCH_CALLS', Caller, Array<Call>>;

export type FetchRequest =
  FetchCallersRequest |
  FetchCallsRequest

// ------------------------------------------- Async Lists --------------------
/* An "async list" is a list which can be fetched and refreshed
 * asynchronously. The idea here is that components that display
 * data are only interested in knowing the state of the fetch if
 * there's no data to show. Otherwise they'll just show the data
 * they have, and any eventual error messages for data that's being refreshed
 * will go into the global error box. An AsyncList can be in one of three
 * states: */
export type AsyncList<ElementType> =
// 1. List hasn't been fetched and no requests have been issued for it (UNFETCHED)
  void |
  // 2. List hasn't been fetched but a request has been issued for it (FETCHING)
  // 3. List hasn't been fetched and the request errored out (ERRORED)
  GenericApiRequest<mixed, mixed, Array<ElementType>> |
  // 4. List has been fetched at least once and there's something cached (CACHED)
  Array<ElementType>;

// Constant table and enum type for accessing async list state.
const AsyncListState = Object.freeze({
  UNFETCHED: 'UNFETCHED',
  FETCHING: 'FETCHING',
  ERRORED: 'ERRORED',
  CACHED: 'CACHED'
});
export type AsyncListStateType = $Keys<typeof AsyncListState>

// Helper function to get the actual state of a given AsyncList.
export function listState<ElementType>(list: AsyncList<ElementType>): AsyncListStateType {
  // (1) Never fetched.
  if (list === undefined) {
    return AsyncListState.UNFETCHED;
  }

  // (2) Fetch request issued.
  if (list.status === PENDING) {
    return AsyncListState.FETCHING;
  }

  // (4) List is cached.
  if (Array.isArray(list)) {
    return AsyncListState.CACHED;
  }

  // (3) Fetch errored out.
  if (list.outcome.type === FAILURE) {
    return AsyncListState.ERRORED;
  }

  throw 'Invalid AsyncList list state!';
}

export const EMPTY_ASYNC_LIST = undefined;

export function updateAsyncList<ElementType>(
  prevList: AsyncList<ElementType>,
  update: GenericApiRequest<any, any, Array<ElementType>>
): AsyncList<ElementType> {
  // We only care for pending requests if nothing has been fetched yet (1,3). Otherwise
  // we just return whatever is already there, which is typically the last version
  // of the array that's been fetched, but could also be some other pending request.
  if (update.status === PENDING) {
    return listState(prevList) === AsyncListState.UNFETCHED ||
    listState(prevList) === AsyncListState.ERRORED ? update : prevList;
  }

  // If it's a successful outcome, returns the payload and either transitions from
  // (4) -> (4) (list refresh) or from (2,3) -> (4) (first successful fetch).
  if (update.outcome.type === SUCCESS) {
    return update.outcome.payload;
  }

  // If we got thus far, the request has failed. Only returns the errored request
  // if we never got to state (4).
  return Array.isArray(prevList) ? prevList : update;
}

export function renderAsyncList<ElementType>(
  list: AsyncList<ElementType>,
  fetching: () => React$Node,
  success: (Array<ElementType>) => React$Node,
  error?: (string) => React$Node
): React$Node {
  // Flow can't infer these cases, so we disable it here.
  switch (listState(list)) {
    case AsyncListState.UNFETCHED:
    case AsyncListState.FETCHING:
      return fetching();
    case AsyncListState.ERRORED:
      // $FlowIgnore
      return error ? error(list.outcome.reason) : fetching();
    case AsyncListState.CACHED:
      // $FlowIgnore
      return success(list);
  }

  throw 'Invalid AsyncList list state!';
}

// ----------------------------- Write Actions---------------------------------

export const PATCH_CALLERS = 'PATCH_CALLERS';
FORMATTERS[PATCH_CALLERS] = ({
  success: {
    message: (input: Array<CallerDelta>) => `${input.length} item(s) updated successfully.`
  },
  failure: {
    message: (input: Array<CallerDelta>, reason: string) => 'Update failed.'
  }
}: StatusMessageFormatter<Array<CallerDelta>, void>);
export type PatchCallerRequest = {|
  type: 'PATCH_CALLERS',
  ...AsyncRequest<Array<CallerDelta>, void>
|};


export const CREATE_CALLER = 'CREATE_CALLER';
FORMATTERS[CREATE_CALLER] = ({
  success: {
    message: (input: NewCaller) => `Caller (${input.areaCode})${input.number} has been added.`
  },
  failure: {
    message: (input: NewCaller, reason: string) => `Failed to add new caller (${reason}).`
  }
}: StatusMessageFormatter<NewCaller, void>);

export type CreateCallerRequest = {|
  type: 'CREATE_CALLER',
  ...AsyncRequest<NewCaller, void>
|};

export type WriteRequest =
  PatchCallerRequest |
  CreateCallerRequest;

// --------------------------- Other Actions ----------------------------------

export const CLEAR_CACHE = 'CLEAR_CACHE';
export type ClearCache = {|
  type: 'CLEAR_CACHE'
|}

// ----------------------------------------------------------------------------

// Catch-all types for API requests and actions.
export type ApiRequest =
  FetchRequest |
  WriteRequest;

export type ApiAction =
  ApiRequest |
  ClearCache;

// ---------------------- Actions on Callers-----------------------------------

export const CallerOrderings = Object.freeze({
  last_call: 'last_call',
  calls: 'calls',
  date_inserted: 'date_inserted',
  description: 'description',
  text_score: 'text_score'
});

// We support retries for fetch requests, but not for write requests
// as those may not be idempotent.
const RETRY_UNTIL_SUCCESS = Number.POSITIVE_INFINITY;
const NO_RETRY = -1;

export function fetchCallers(
  ordering: $Keys<typeof CallerOrderings> = 'last_call',
  text: ?string,
  retry: boolean = false
) {
  console.log(retry);
  return (dispatch: Dispatch) => {
    apiRequest(
      `${API_PARAMETERS.endpoint}api/callers/?ordering=${ordering}${text ? `&text=${text}` : ''}`,
      {},
      (
        {
          type: FETCH_CALLERS,
          status: PENDING,
          source: undefined
        }: FetchCallersRequest
      ),
      dispatch,
      (object: Object) => (camelize(object): Caller),
      retry ? RETRY_UNTIL_SUCCESS : NO_RETRY
    );
  }
}

export function patchCallers(
  patches: Array<CallerDelta>,
): Promise<Response> {
  return (dispatch: Dispatch) =>
    apiRequest(
      `${API_PARAMETERS.endpoint}api/callers/`,
      {
        headers: {'Content-Type': 'application/json'},
        method: 'PATCH',
        body: JSON.stringify(patches.map(toAPIObject)) // We don't do any verification here.
      },
      (
        {
          type: PATCH_CALLERS,
          status: PENDING,
          source: patches
        }: PatchCallerRequest
      ),
      dispatch
    );
}

export function createCaller(caller: NewCaller) {
  return (dispatch: Dispatch) =>
    apiRequest(
      `${API_PARAMETERS.endpoint}api/callers/`,
      {
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
        body: JSON.stringify(toAPIObject(caller))
      },
      (
        {
          type: CREATE_CALLER,
          status: PENDING,
          source: caller
        }: CreateCallerRequest
      ),
      dispatch
    )
}

// ---------------------- Actions on Calls ------------------------------------

export function fetchCalls(
  caller: Caller,
  retry: boolean = false
): Promise<Response> {
  return (dispatch: Dispatch) =>
    apiRequest(
      `${API_PARAMETERS.endpoint}api/callers/${caller.areaCode}-${caller.number}/calls/`,
      {},
      (
        {
          type: FETCH_CALLS,
          status: PENDING,
          source: caller
        }: FetchCallsRequest
      ),
      dispatch,
      (object: Object) => (camelize(object): Call),
      retry ? RETRY_UNTIL_SUCCESS : NO_RETRY
    )
}

// ---------------------- Other Actions ---------------------------------------

export function clearCache(): ClearCache {
  return {
    type: CLEAR_CACHE
  }
}

// -------------- Generic helpers for fetching and writing objects ------------

function apiRequest<Output>(
  input: string,
  init: Object,
  request: ApiRequest,
  dispatch: Dispatch,
  mapResponse?: (jsonResponse: Object) => Output,
  retry: number = -1,
  backoff: number = 500,
  maxBackoff: number = 3000
): Promise<Response> {
  // Dispatches pending request.
  dispatch(request);
  // Runs it.
  return (
    fetch(input, init)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        // Failure, bad response.
        else {
          dispatch({
            type: request.type,
            status: COMPLETE,
            source: request.source,
            outcome: {
              type: FAILURE,
              // We don't retry if the server crapped out.
              retry: false,
              reason: response.statusText
            }
          })
        }
      }).then(data => {
        if (data) {
          // Success.
          dispatch(({
            type: request.type,
            status: COMPLETE,
            source: request.source,
            outcome: {
              type: SUCCESS,
              payload: mapResponse ? data.map(mapResponse) : data
            }
          }));
        }
      }).catch(reason => {
        const shouldRetry = retry > 0;
        // Failure, promise rejected.
        dispatch({
          type: request.type,
          status: COMPLETE,
          source: request.source,
          outcome: {
            type: FAILURE,
            retry: shouldRetry,
            reason: reason
          }
        });
        // Repeats the request if so desired.
        if (shouldRetry) {
          setTimeout(() =>
            apiRequest(
              input, init, request, dispatch, mapResponse,
              retry - 1,
              Math.min(backoff * 2, maxBackoff),
              maxBackoff
            ),
            backoff
          )
        }
      })
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
