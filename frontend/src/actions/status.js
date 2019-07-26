// @flow

export const SHOW_STATUS = 'SHOW_STATUS';
export const CLEAR_STATUS = 'CLEAR_STATUS';

export type SetStatusAction = {|
  type: 'SHOW_STATUS',
  operationId: string,
  success: boolean,
  message: string,
  timerId: ?TimeoutID
|};

export type ClearStatusAction = {|
  type: 'CLEAR_STATUS',
  operationId: string
|}

export type StatusAction =
  SetStatusAction |
  ClearStatusAction;

export type OperationStatus = {|
  operationId: string,
  success: boolean,
  message: string,
  timerId: ?TimeoutID
|};

export function reportStatus(operationId: string, message: string, success: boolean, clearAfter: number) {
  if (clearAfter === 0) {
    return displayStatus(operationId, message, success);
  }

  return (dispatch: any, getState: any) => {
    let existing = getState().operationStatus.get(operationId);
    // Clears previous timer, if the error has already been set with a timeout.
    if (existing && existing.timerId) {
      clearTimeout(existing.timerId);
    }

    dispatch(displayStatus(
      operationId,
      message,
      success,
      setTimeout(() => dispatch(clearStatus(operationId)), clearAfter)
    ));
  }
}

export const displayStatus = (operationId: string, message: string, success: boolean, timerId: ?TimeoutID = null) => ({
  type: SHOW_STATUS,
  operationId: operationId,
  success: success,
  message: message,
  timerId: timerId
}: SetStatusAction);

export const clearStatus = (errorId: string) => ({
  type: CLEAR_STATUS,
  operationId: errorId
}: ClearStatusAction);