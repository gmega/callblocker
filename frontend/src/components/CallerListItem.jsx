// @flow

import {Avatar, Box, IconButton, ListItem, ListItemAvatar, ListItemText, Tooltip, Typography} from '@material-ui/core';
import {blue} from '@material-ui/core/colors';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Block, Delete, Edit, Phone} from '@material-ui/icons';
import moment from 'moment';
import React from 'react';
import {isIOS} from 'react-device-detect';
import {formatTime} from '../helpers';
import type {Caller} from '../types/domainTypes';

const useStyles = makeStyles(theme => ({
  selectedAvatar: {
    backgroundColor: blue[500]
  }
}));

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
        <ListItemAvatar onClick={toggleSelected}>
          <Avatar className={props.selected ? classes.selectedAvatar : null}>
            {
              caller.block ? <Block/> : <Phone/>
            }
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={`(${caller.areaCode}) ${caller.number}`}
          secondary={
            `${caller.description ? caller.description : 'Unknown Caller'} - ${props.caller.calls} calls`
          }
        />
        {editBarOpen ?
          <div>
            <Tooltip title='Edit'>
              <IconButton aria-label='Edit' onClick={handleEdit}>
                <Edit/>
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton aria-label='Delete' onClick={handleDelete}>
                <Delete/>
              </IconButton>
            </Tooltip>
          </div> :
          <Typography variant='caption' color='textSecondary'>
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
