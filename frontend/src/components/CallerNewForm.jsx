// @flow

import {Box, Button, Dialog, DialogContent, TextField, useTheme} from '@material-ui/core';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Cancel, Save} from '@material-ui/icons';
import React from 'react';
import type {Caller, CallerDelta, NewCaller} from '../types/domainTypes';
import {SimpleCallerListItem} from './CallerListItem';

const useStyles = makeStyles(theme => ({
  editorContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: theme.spacing(2)
  },
  editorTypography: {
    padding: theme.spacing(2)
  },
  editorItems: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  }
}));

export default function CallerNewForm(props: {
  open: boolean,
  onSubmit: (delta: NewCaller) => void,
  onCancel: () => void
}) {

  const classes = useStyles();
  const theme = useTheme();

  const [callerInfo, setCallerInfo] = React.useState(({
    areaCode: '',
    number: '',
    block: false,
    description: '',
    notes: ''
  }: NewCaller));

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
    props.onCancel();
  }

  return (
    <Dialog open={props.open}>
      <DialogContent>
        <Box className={classes.editorContainerInner}>
          <SimpleCallerListItem caller={callerInfo} wrapBox/>
        </Box>
        <Box className={classes.editorContainer}>
          <TextField
            className={classes.editorItems}
            id='areaCode'
            label='Area Code'
            value={callerInfo.areaCode}
            onChange={handleChange('areaCode')}
          />
          <TextField
            className={classes.editorItems}
            id='number'
            label='Number'
            value={callerInfo.number}
            onChange={handleChange('number')}
          />
          <TextField
            className={classes.editorItems}
            id='description'
            label='Name'
            value={callerInfo.description}
            onChange={handleChange('description')}
          />
          <TextField
            className={classes.editorItems}
            id='notes'
            label='Notes'
            value={callerInfo.notes}
            onChange={handleChange('notes')}
            multiline
          />
        </Box>
        <Box>
          <Button
            variant='contained'
            size='small'
            onClick={handleSaveClicked}
            className={classes.editorItems}
            style={{marginLeft: theme.spacing(2)}}
          >
            <Save style={{marginRight: theme.spacing(1)}}/>Save
          </Button>
          <Button
            variant='contained'
            size='small'
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

CallerNewForm.defaultProps = {
  onSubmit: (caller: NewCaller) => undefined,
  onCancel: () => undefined
};
