// @flow
import {Map as IMap} from 'immutable';
import type {ApiAction, ApiRequest, AsyncList} from '../actions/api';
import {
  updateAsyncList,
  CLEAR_CACHE,
  EMPTY_ASYNC_LIST,
  FETCH_CALLERS,
  FETCH_CALLS,
  CREATE_CALLER, PATCH_CALLERS
} from '../actions/api';
import type {Call, Caller} from '../types/domainTypes';


export type ApiState = {
  callers: AsyncList<Caller>,
  calls: IMap<string, AsyncList<Call>>,
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
  lastRequest: {
    counter: 0
  }
};

export default (state: ApiState = initialState, action: ApiAction): ApiState => {
  console.log(action);
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
    case CREATE_CALLER:
    case PATCH_CALLERS:
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