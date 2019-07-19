// @flow

import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import {blue} from '@material-ui/core/colors';

import {useTheme} from '@material-ui/core/styles';
import makeStyles from "@material-ui/core/styles/makeStyles";
import {Block, Cancel, Delete, Edit, Phone, Save} from "@material-ui/icons";
import moment from 'moment';

import React from "react";
import {isIOS, isMobile} from "react-device-detect";
import {camelize, formatTime, snakeize} from "./helpers";

const useStyles = makeStyles(theme => ({
  editorContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: theme.spacing(2)
  },
  editorContainerInner: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3)
  },
  editorTypography: {
    padding: theme.spacing(2)
  },
  editorItems: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  selectedAvatar: {
    backgroundColor: blue[500]
  }

}));

export type Caller = {|
  areaCode: string,
  number: string,
  fullNumber: string,
  block: boolean,
  lastCall: string,
  description: string,
  notes: string,
  calls: number;
|};

export type CallerDelta = {|
  original: Caller,
  block?: boolean;
  lastCall?: string;
  description?: string;
  notes?: string;
  calls?: number;
|};

export function toAPIObject(caller: Caller | CallerDelta): Object {
  if (caller.original) {
    return snakeize({
      fullNumber: caller.original.fullNumber,
      ...caller
    })
  } else {
    return snakeize(caller);
  }
}

export function fromAPIObject(object: Object): Caller {
  // We trust the API not to screw up ;-)
  return (camelize(object): Caller);
}

export function CallerListItem(props: {
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

  if (!isMobile || !isIOS) {
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
            <Tooltip title="Edit">
              <IconButton aria-label="Edit" onClick={handleEdit}>
                <Edit/>
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton aria-label="Delete" onClick={handleDelete}>
                <Delete/>
              </IconButton>
            </Tooltip>
          </div> :
          <Typography variant="caption" color="textSecondary">
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


function CallerEditForm(props: {
  caller: Caller,
  open: boolean,
  onSubmit: (delta: CallerDelta) => void,
  onCancel: (caller: Caller) => void
}) {
  const [callerInfo, setCallerInfo] = React.useState(({
    original: props.caller,
    description: props.caller.description,
    notes: props.caller.notes
  }: CallerDelta));
  const classes = useStyles();
  const theme = useTheme();

  const handleChange = fieldId => content => {
    setCallerInfo({
      ...callerInfo,
      [fieldId]: content.target.value
    });
  };

  function handleSaveClicked() {
    props.onSubmit({...callerInfo});
  }

  function handleCancelClicked() {
    props.onCancel(props.caller);
  }

  return (
    <Dialog open={props.open}>
      <DialogContent>
        <Box className={classes.editorContainerInner}>
          <ListItemAvatar>
            <Avatar>
              {props.caller.block ? <Block/> : <Phone/>}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`(${props.caller.areaCode}) ${props.caller.number}`}
            secondary={
              `${props.caller.description ? props.caller.description : 'Unknown Caller'} - ${
                props.caller.calls} ${(props.caller.calls === 1) ? 'call' : 'calls'}`
            }
          />
        </Box>
        <Box className={classes.editorContainer}>
          <TextField
            className={classes.editorItems}
            id="description"
            label="Description"
            value={callerInfo.description}
            onChange={handleChange('description')}
          />
          <TextField
            className={classes.editorItems}
            id="notes"
            label="Notes"
            value={callerInfo.notes}
            onChange={handleChange('notes')}
            multiline
          />
        </Box>
        <Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleSaveClicked}
            className={classes.editorItems}
            style={{marginLeft: theme.spacing(2)}}
          >
            <Save style={{marginRight: theme.spacing(1)}}/>Save
          </Button>
          <Button
            variant="contained"
            size="small"
            className={classes.editorItems}
            onClick={handleCancelClicked}
            style={{marginLeft: theme.spacing(2)}}
          >
            <Cancel style={{marginRight: theme.spacing(1)}}/>Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

CallerEditForm.defaultProps = {
  description: '',
  notes: '',
  onSubmit: (delta: CallerDelta) => undefined,
  onCancel: (caller: Caller) => undefined
};

export function EditableCaller(props: {
  caller: Caller,
  selected: boolean,
  onSubmit: (delta: CallerDelta) => void,
  onSelect: (caller: Caller, selected: boolean) => void;
}) {

  const [editFormOpen, setEditFormOpen] = React.useState(false);
  (editFormOpen: boolean);

  function handleEditClicked() {
    setEditFormOpen(true);
  }

  function handleFormSubmitted(delta: CallerDelta) {
    setEditFormOpen(false);
    props.onSubmit(delta);
  }

  function handleEditCancelled() {
    setEditFormOpen(false);
  }

  return (
    <div>
      <CallerListItem {...props} onEdit={handleEditClicked} onSelect={props.onSelect}/>
      <CallerEditForm {...props} open={editFormOpen} onSubmit={handleFormSubmitted}
                      onCancel={handleEditCancelled}/>
    </div>
  )
}

EditableCaller.defaultProps = {
  onSelect: CallerListItem.defaultProps.onSelect,
  onSubmit: CallerEditForm.defaultProps.onSubmit
};
