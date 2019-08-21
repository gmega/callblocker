// @flow
import {Map as IMap} from 'immutable';
import type {ApiAction, ApiRequest, AsyncList} from '../actions/api';
import {
  CLEAR_CACHE,
  CREATE_CALLER,
  EMPTY_ASYNC_LIST,
  FETCH_CALLERS,
  FETCH_CALLS,
  FETCH_SERVICES,
  PATCH_CALLERS,
  PATCH_SERVICE,
  updateAsyncList
} from '../actions/api';
import type {Call, Caller, Service} from '../types/domainTypes';


export type ApiState = {
  callers: AsyncList<Caller>,
  calls: IMap<string, AsyncList<Call>>,
  services: AsyncList<Service>,
  // This is the easiest way I could think of to get the global status
  // bar to pick up all of the incoming requests. This works as a kind
  // of pseudo messaging queue where we can only see the head.
  lastRequest: {
    request?: ApiRequest,
    counter: number
  }
};

const initialState = {
  callers: undefined,
  calls: IMap(),
  services: undefined,
  lastRequest: {
    counter: 0
  }
};

export default (state: ApiState = initialState, action: ApiAction): ApiState => {
  switch (action.type) {
    case FETCH_CALLERS:
      return {
        ...state,
        callers: updateAsyncList<Caller>(state.callers, action),
        lastRequest: updateLastRequest(state, action)
      };
    case FETCH_CALLS:
      return {
        ...state,
        // $FlowIgnore -- not sure why but flow cannot infer the right types for this statement.
        calls: state.calls.set<string, AsyncList<Call>>(
          action.source.fullNumber,
          updateAsyncList<Call>(state.calls.get(action.source.fullNumber, EMPTY_ASYNC_LIST), action)
        ),
        lastRequest: updateLastRequest(state, action)
      };
    case FETCH_SERVICES:
      return {
        ...state,
        services: updateAsyncList<Service>(state.services, action),
        lastRequest: updateLastRequest(state, action)
      };
    case CREATE_CALLER:
    case PATCH_CALLERS:
    case PATCH_SERVICE:
      return {
        ...state,
        lastRequest: updateLastRequest(state, action)
      };
    case CLEAR_CACHE:
      // Throws away all fetched objects.
      return initialState;
    default:
      return state;
  }
}

function updateLastRequest(state: ApiState, request: ApiRequest) {
  return {
    request: request,
    counter: state.lastRequest.counter + 1
  }
}