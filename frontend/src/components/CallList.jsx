// @flow

import {Button, Dialog, DialogActions, DialogContent} from '@material-ui/core';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import type {Call, Caller} from '../types/domainTypes';

export default (props: {
  open: boolean,
  caller: Caller,
  calls: Array<Call>,
  onClose: () => void
}) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <DialogContent>
        <DialogTitle>
          Calls from {props.caller.fullNumber}
        </DialogTitle>
        <div>{
          props.calls.map(call => {
            `${call.time}`
          })
        }
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color='primary'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}