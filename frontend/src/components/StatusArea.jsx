// @flow

import {Snackbar} from '@material-ui/core';
import React from 'react';
import type {OperationStatus} from '../actions/status';
import {StatusSnackbarContent} from './StatusSnackbarContent';
import {Set as ISet, Map as IMap} from 'immutable';


export function StatusArea(props: { status: IMap<string, OperationStatus> }) {

  const [suppressed, setSuppressed] = React.useState(ISet());

  function suppress(key) {
    setSuppressed(suppressed.add(key));

    setTimeout(() => {
      setSuppressed(suppressed.delete(key));
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
