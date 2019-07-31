// @flow

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  makeStyles,
  Typography
} from '@material-ui/core';
import {blue} from '@material-ui/core/colors';
import DialogTitle from '@material-ui/core/DialogTitle';
import {CallReceived, Cancel} from '@material-ui/icons';
import moment from 'moment';
import React from 'react';
import {isMobile} from 'react-device-detect';
import {formatTime} from '../helpers';
import type {Call, Caller} from '../types/domainTypes';
import {SimpleCallerListItem} from './CallerListItem';

const useStyles = makeStyles(theme => ({
  selectedAvatar: {
    backgroundColor: blue[500]
  },
  selectedListItem: {
    backgroundColor: '#AFB9FF'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1)
  },
  listItemIcon: {
    marginRight: theme.spacing(2)
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(1)
  },
  callerListItem: {
    paddingBottom: theme.spacing(1)
  }
}));

export function CallList(props: {
  open: boolean,
  caller: Caller,
  calls: Array<Call>,
  onClose: () => void
}) {
  const classes = useStyles();

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
      <DialogContent> {
        props.calls.length > 0 ?
          <DialogContent> {
            props.calls.map(call => {
              return <CallListItem call={call}/>
            })
          }
          </DialogContent> :
          <div className={classes.spinner}>
            <CircularProgress/>
          </div>
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

function CallListItem(props: { call: Call }) {

  const classes = useStyles();

  const [isSelected, setSelected] = React.useState(false);

  const hoverHandlers = isMobile ? {} : {
    onMouseOver: () => setSelected(true),
    onMouseLeave: () => setSelected(false)
  };

  return (
    <div className={isSelected ? classes.selectedListItem : ''} {...hoverHandlers}>
      <div className={classes.listItem}>
        {props.call.blocked ?
          <Cancel className={classes.listItemIcon} htmlColor='#792E33' fontSize='large'/> :
          <CallReceived className={classes.listItemIcon} htmlColor='green' fontSize='large'/>}
        <Typography variant='caption' color='textSecondary'>
          {props.call.blocked ? 'blocked' : 'received'} {formatTime(moment(props.call.time))}</Typography>
      </div>
    </div>
  )
}