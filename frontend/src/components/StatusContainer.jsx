// @flow

import {withSnackbar, WithSnackbarProps} from 'notistack';
import React, {useEffect} from 'react';
import type {ApiRequest, FormatterRegistry} from '../actions/api';
import {COMPLETE, FAILURE, SUCCESS} from '../actions/api';
import type {ApplicationState} from '../reducers';

const DEFAULT_DISPLAY_TIMEOUT = 3000;

function StatusContainer(props: {
  enqueueSnackbar: $PropertyType<WithSnackbarProps, 'enqueueSnackbar'>,
  closeSnackbar: $PropertyType<WithSnackbarProps, 'closeSnackbar'>,
  formatter: FormatterRegistry,
  state: ApplicationState
}) {

  const {formatter, state} = props;

  const [lastSeen, setLastSeen] = React.useState<number>(-1);

  useEffect(() => {
    const {counter, request} = state.lastRequest;
    if (counter !== lastSeen && request) {
      displayOutcome(request);
      setLastSeen(counter);
    }
  });

  function displayOutcome(request: ApiRequest) {
    // We only track complete requests. Tracking incomplete requests
    // requires a more complex scheme.
    if (request.status !== COMPLETE) {
      return;
    }

    const {success, failure} = formatter[request.type];
    switch (request.outcome.type) {

      case SUCCESS:
        if (success) {
          props.enqueueSnackbar(
            success.message(request.source, request.outcome.payload),
            {
              key: request.type,
              variant: 'success',
              autoHideDuration: success.displayFor || DEFAULT_DISPLAY_TIMEOUT,
              preventDuplicate: true
            }
          );
        }
        break;

      case FAILURE:
        props.enqueueSnackbar(
          failure.message(request.source, request.outcome.reason),
          {
            key: request.type,
            variant: 'error',
            autoHideDuration: failure.displayFor || DEFAULT_DISPLAY_TIMEOUT,
            preventDuplicate: true
          }
        );
        break;

      default:
        break;
    }

  }

  return null;
}

export default withSnackbar(StatusContainer);