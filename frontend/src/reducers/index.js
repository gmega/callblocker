// @flow

import type {ApiState} from './api';
import apiReducer from './api';

// For now, root state maps directly into ApiState.
export type ApplicationState = ApiState;
export const rootReducer = apiReducer;