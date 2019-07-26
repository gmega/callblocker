// @flow

import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  ListItemAvatar,
  ListItemText,
  TextField,
  useTheme
} from '@material-ui/core';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Block, Cancel, Phone, Save} from '@material-ui/icons';
import React from 'react';
import type {Caller, CallerDelta} from '../types/domainTypes';

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
  }
}));

export default function CallerEditForm(props: {
  caller: Caller,
  open: boolean,
  onSubmit: (delta: CallerDelta) => void,
  onCancel: (caller: Caller) => void
}) {

  const classes = useStyles();
  const theme = useTheme();

  const [callerInfo, setCallerInfo] = React.useState(({
    original: props.caller,
    description: props.caller.description,
    notes: props.caller.notes
  }: CallerDelta));

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
