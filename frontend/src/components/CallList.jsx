// @flow

import {Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, makeStyles} from '@material-ui/core';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import type {AsyncList} from '../actions/api';
import {renderAsyncList} from '../actions/api';
import type {Call, Caller} from '../types/domainTypes';
import {SimpleCallerListItem} from './CallerListItem';
import CallListItem from './CallListItem';

const useStyles = makeStyles(theme => ({
  callListSeparator: {
    paddingBottom: theme.spacing(2)
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(1)
  }
}));

export function CallList(props: {
  open: boolean,
  caller: Caller,
  calls: AsyncList<Call>,
  onClose: () => void
}) {
  const classes = useStyles();

  const calls = props.calls;

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>Call History</DialogTitle>
      <SimpleCallerListItem
        caller={props.caller}
        wrapBox
      />
      {/*
      * This Box is required as otherwise the call list items
      * will move above the caller description on scroll in iOS.
      * Don't know why, and could not fix it otherwise.
      */}
      <Box className={classes.callerListItem}/>
      <DialogContent>
        {
          renderAsyncList(
            calls,
            () => (
              <div className={classes.spinner}>
                <CircularProgress/>
              </div>
            ),
            (calls: Array<Call>) => (
              <DialogContent> {
                calls.map(call => {
                  return <CallListItem key={call.time} call={call}/>
                })
              }
              </DialogContent>
            ),
            (reason: string) => 'Failed to fetch list contents.'
          )
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color='primary'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
