// @flow

import {Snackbar} from '@material-ui/core';
import React from 'react';
import type {OperationStatus} from '../actions/status';
import {StatusSnackbarContent} from './StatusSnackbarContent';


export function StatusArea(props: { status: Map<string, OperationStatus> }) {

  const [suppressed, setSuppressed] = React.useState(new Set());

  function suppress(key) {
    const newState = new Set(suppressed);
    newState.add(key);
    setSuppressed(newState);

    setTimeout(() => {
      const newState = new Set(suppressed);
      newState.delete(key);
      setSuppressed(newState);
    }, 3000);
  }

  if (props.status.size) {
    return (
      [...props.status.entries()].map<any>(([key, status]) => {
        return <Snackbar
          key={key}
          open={!suppressed.has(key)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center'
          }}
        >
          <StatusSnackbarContent
            variant={status.success ? 'success' : 'error'}
            message={status.message}
            onClose={() => suppress(key)}
          />
        </Snackbar>
      })
    )
  } else {
    return <div></div>;
  }
}
