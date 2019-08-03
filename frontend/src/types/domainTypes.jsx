// @flow

// Fields which can never be set for any Caller.
export type CallerUnmodifiable = {|
  lastCall: string,
  calls: number
|}

// Fields which can be set for new and existing callers.
export type CallerModifiable = {|
  block?: boolean,
  description?: string,
  notes?: string
|}

// Fields which can be set only for new callers.
export type CallerKey = {|
  areaCode: string,
  number: string
|}

// Caller instance with all fields (returned from API).
export type Caller = {|
  ...CallerKey,
  ...CallerUnmodifiable,
  // Can't just expand CallerModifiable as otherwise we have to handle
  // the ? types all over the code, when these fields are always defined
  // when coming from the API. The other option would be to force the fields
  // to be present in the delta, but this would ruin their direct translation
  // into partial updates for API PATCH requests.
  block: boolean,
  description: string,
  notes: string,
  fullNumber: string
|}

// Edits made to existing callers.
export type CallerDelta = {|
  ...CallerModifiable,
  original: Caller
|}

// New callers.
export type NewCaller = {|
  ...CallerKey,
  ...CallerModifiable
|}

export type Call = {|
  caller: string,
  blocked: boolean,
  time: string
|};
