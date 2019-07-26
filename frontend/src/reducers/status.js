// @flow

import type {OperationStatus, StatusAction} from '../actions/status';
import {CLEAR_STATUS, SHOW_STATUS} from '../actions/status';

export type OperationState = Map<string, OperationStatus>

const initialState = (new Map());

export default (state: OperationState = initialState, action: StatusAction): OperationState => {
  let newState;
  switch (action.type) {
    case SHOW_STATUS:
      newState = new Map(state);
      newState.set(action.operationId, {
        operationId: action.operationId,
        success: action.success,
        message: action.message,
        timerId: action.timerId
      });
      return newState;

    case CLEAR_STATUS:
      newState = new Map(state);
      newState.delete(action.operationId);
      return newState;

    default:
      return state;
  }
};

