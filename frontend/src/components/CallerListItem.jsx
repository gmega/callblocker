// @flow

import {Avatar, Box, IconButton, ListItem, ListItemAvatar, ListItemText, Tooltip, Typography} from '@material-ui/core';
import {blue} from '@material-ui/core/colors';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Block, Delete, Edit, Phone} from '@material-ui/icons';
import clsx from 'clsx';
import moment from 'moment';
import React from 'react';
import {isIOS} from 'react-device-detect';
import {formatTime} from '../helpers';
import type {Caller, NewCaller} from '../types/domainTypes';
import Nop from './Nop';

const useStyles = makeStyles(theme => ({
  selectedAvatar: {
    backgroundColor: blue[500]
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3)
  },
  listItemText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  timeOfCall: {
    paddingLeft: theme.spacing(2)
  },
  unwrappable: {
    whiteSpace: 'nowrap'
  },
  unshrinkable: {
    flexShrink: '0px'
  }
}));

export function SimpleCallerListItem(props: {
  wrapBox: boolean,
  wrapBoxClassName: string,
  caller: Caller | NewCaller,
  selected: boolean,
  onClick: (event: Event) => void
}) {

  const classes = useStyles();

  const caller = props.caller;

  function renderCallSummary() {
    return (
      `${caller.description ? caller.description : 'Unknown Caller'} - ` +
      (
        !caller.calls ?
          'never called.' :
          `${caller.calls} call${caller.calls > 1 ? 's' : ''}`
      )
    )
  }

  function renderInner() {
    return (
      <Nop>
        <ListItemAvatar onClick={props.onClick}>
          <Avatar className={props.selected ? classes.selectedAvatar : null}>
            {
              caller.block ? <Block/> : <Phone/>
            }
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          secondaryTypographyProps={{className: clsx(classes.unwrappable, classes.listItemText)}}
          primary={`(${caller.areaCode || 'XX'}) ${caller.number || 'XXXXXXXX'}`}
          className={classes.listItemText}
          secondary={renderCallSummary()}
        />
      </Nop>
    )
  }

  if (props.wrapBox) {
    return (
      <Box className={clsx(classes.listItem, props.wrapBoxClassName)}>
        {renderInner()}
      </Box>
    )
  } else {
    return renderInner();
  }
}

SimpleCallerListItem.defaultProps = {
  wrapBoxClassName: '',
  wrapBox: false,
  selected: false,
  onClick: () => undefined
};

export default function CallerListItem(props: {
  caller: Caller,
  selected: boolean,
  onEdit: (caller: Caller) => void,
  onDelete: (caller: Caller) => void,
  onClick: (caller: Caller) => void,
  onSelect: (caller: Caller, selected: boolean) => void
}) {

  const classes = useStyles();

  const [editBarOpen, setEditBarOpen] = React.useState(false);

  function handleEdit() {
    props.onEdit(props.caller);
  }

  function handleDelete() {
    props.onDelete(props.caller);
  }

  function handleMouseOver() {
    setEditBarOpen(true);
  }

  function handleMouseClick() {
    // We emit a click event only if the edit bar is active. On mobile, this means
    // you must click twice to get a click event. On the Desktop, this will translate
    // into a regular click as the edit bar will activate on mouse hover.
    if (editBarOpen) {
      props.onClick(props.caller);
      return;
    }

    handleMouseOver();
  }

  function handleMouseOut() {
    setEditBarOpen(false);
  }

  function toggleSelected() {
    props.onSelect(caller, !props.selected);
  }

  function noClick(handler: () => void) {
    return (event: Event) => {
      event.stopPropagation();
      handler();
    }
  }

  /*
  * Safari on iOS will screw up our onClick event on the list avatar if we install an onMouseOver handler
  * in its parent:
  *
  *    http://sitr.us/2011/07/28/how-mobile-safari-emulates-mouse-events.html
  *
  * My testing shows, however, that the same problem happens in Firefox. So we do not install
  * onMouseOver it if we're running in iOS. It's not needed anyways.
  * */
  const listItemHandlers = {
    onClick: handleMouseClick,
    onMouseLeave: handleMouseOut
  };

  if (!isIOS) {
    // $FlowIgnore: assignment to sealed object.
    listItemHandlers.onMouseOver = handleMouseOver
  }

  const caller = props.caller;

  return (
    <Box boxShadow={editBarOpen ? 1 : 0} style={{margin: '5px'}}>
      <ListItem key={caller.fullNumber} {...listItemHandlers}>
        <SimpleCallerListItem
          caller={caller}
          onClick={noClick(toggleSelected)}
          selected={props.selected}/>
        {editBarOpen ?
          <div className={classes.unshrinkable}>
            <Tooltip title='Edit'>
              <IconButton aria-label='Edit' onClick={noClick(handleEdit)}>
                <Edit/>
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton aria-label='Delete' onClick={noClick(handleDelete)}>
                <Delete/>
              </IconButton>
            </Tooltip>
          </div> :
          <Typography variant='caption' color='textSecondary' className={clsx(classes.unwrappable, classes.timeOfCall)}>
            {formatTime(moment(caller.lastCall))}
          </Typography>
        }
      </ListItem>
    </Box>
  )
}

CallerListItem.defaultProps = {
  onEdit: (caller: Caller) => undefined,
  onClick: (caller: Caller) => undefined,
  onDelete: (caller: Caller) => undefined,
  onSelect: (caller: Caller, selected: boolean) => undefined
};
