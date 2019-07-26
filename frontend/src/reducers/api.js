// @flow
import type {ApiAction} from '../actions/api';
import {CALLERS_FETCH_SUCCESS, CALLS_FETCH_SUCCESS} from '../actions/api';
import type {Call, Caller} from '../types/domainTypes';

export type ApiObjects = {
  callers: Array<Caller>,
  calls: Map<string, Array<Call>>
};

const initialState = {
  callers: [],
  calls: new Map()
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
        calls: new Map<string, Call>(action.calls.map((call) => [call.caller, call]))
      };
    default:
      return state;
  }
}