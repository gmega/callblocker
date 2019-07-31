// @flow
import type {ApiAction} from '../actions/api';
import {CALLERS_FETCH_SUCCESS, CALLS_FETCH_SUCCESS} from '../actions/api';
import type {Call, Caller} from '../types/domainTypes';
import {Map as IMap} from 'immutable';

export type ApiObjects = {
  callers: Array<Caller>,
  calls: IMap<string, Array<Call>>
};

const initialState = {
  callers: [],
  calls: IMap()
};

export default (state: ApiObjects = initialState, action: ApiAction) => {
  switch (action.type) {
    case CALLERS_FETCH_SUCCESS:
      return {
        ...state,
        callers: action.callers
      };
    case CALLS_FETCH_SUCCESS:
      return {
        ...state,
        // $FlowIgnore -- not sure why but flow cannot infer the right types for this statement.
        calls: state.calls.set<string, Array<Call>>(action.caller.fullNumber, action.calls)
      };
    default:
      return state;
  }
}