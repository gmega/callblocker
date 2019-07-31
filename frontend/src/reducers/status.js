// @flow

import {Map as IMap} from 'immutable';
import type {OperationStatus, StatusAction} from '../actions/status';
import {CLEAR_STATUS, SHOW_STATUS} from '../actions/status';

export type OperationState = IMap<string, OperationStatus>

const initialState = IMap();

export default (state: OperationState = initialState, action: StatusAction): OperationState => {
  switch (action.type) {
    case SHOW_STATUS:
      return state.set(action.operationId, {
        operationId: action.operationId,
        success: action.success,
        message: action.message,
        timerId: action.timerId
      });


    case CLEAR_STATUS:
      return state.delete(action.operationId);

    default:
      return state;
  }
};

