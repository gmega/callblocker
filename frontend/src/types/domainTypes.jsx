// @flow

import type {Partial} from '../helpers';

// Fields which can never be set for any Caller.
export type CallerUnmodifiable = {|
  +lastCall?: string,
  +calls: number
|}

// Fields which can be set for new and existing callers.
export type CallerModifiable = {|
  block: boolean,
  description: string,
  notes: string
|}

// Caller instance with all fields (returned from API).
export type Caller = {|
  +fullNumber: string,
  +areaCode: string,
  +number: string,
  ...CallerUnmodifiable,
  ...CallerModifiable
|}

// New callers only have "settable" fields.
export type NewCaller = {|
  areaCode: string,
  number: string,
  ...CallerModifiable
|}

// Deltas can only be issued for modifiable fields, but they are special
// in that they can describe partial updates (i.e., they contain only the fields
// that change wrt the original) and therefore fields are allowed to be missing.
export type CallerDelta = {|
  +original: Caller,
  ...Partial<CallerModifiable>
|}

export type Call = {|
  +caller: string,
  +blocked: boolean,
  +time: string
|};


export const ServiceState = Object.freeze({
  INITIAL: 'INITIAL',
  STARTING: 'STARTING',
  READY: 'READY',
  STOPPING: 'STOPPING',
  TERMINATED: 'TERMINATED',
  ERRORED: 'ERRORED'
});

export type ServiceStateType = $Keys<typeof ServiceState>

export type Service = {|
  +id: string,
  +name: string,
  +status: {
    state: ServiceStateType,
    exception: string | null,
    traceback: Array<string> | null
  }
|}

export type ServiceDelta = {|
  +original: Service,
  +status: {
    state: ServiceStateType
  }
|}