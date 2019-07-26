// @flow
import {combineReducers} from 'redux';
import statusReducer from './status';
import type {OperationState} from './status';

import apiReducer from './api';
import type {ApiObjects} from './api';

export type StateType = {
  operationStatus: OperationState,
  apiObjects: ApiObjects
};

export const rootReducer = combineReducers({
  operationStatus: statusReducer,
  apiObjects: apiReducer
});