// @flow

import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from '@material-ui/core';
import React from 'react';
import type {AsyncList} from '../actions/api';
import type {Call, Caller, CallerDelta} from '../types/domainTypes';
import CallerEditForm from './CallerEditForm';
import CallerListItem from './CallerListItem';
import {CallList} from './CallList';

export default function EditableCaller(props: {
  caller: Caller,
  calls: AsyncList<Call>,
  selected: boolean,
  onDisplayCalls: (caller: Caller) => void,
  onSubmit: (delta: CallerDelta) => void,
  onSelect: (caller: Caller, selected: boolean) => void,
  onDelete: (caller: Caller) => void
}) {

  const [editFormOpen, setEditFormOpen] = React.useState(false);
  const [callListOpen, setCallListOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

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

  function handleCallerClicked() {
    props.onDisplayCalls(props.caller);
    setCallListOpen(true);
  }

  function handleDeleteClicked() {
    setDeleteDialogOpen(true);
  }

  function handleDeleteConfirmed() {
    props.onDelete(props.caller);
    setDeleteDialogOpen(false);
  }

  return (
    <div>
      <CallerListItem {...props}
                      onEdit={handleEditClicked}
                      onSelect={props.onSelect}
                      onClick={handleCallerClicked}
                      onDelete={handleDeleteClicked}/>
      <CallerEditForm {...props}
                      open={editFormOpen}
                      onSubmit={handleFormSubmitted}
                      onCancel={handleEditCancelled}/>
      {
        callListOpen ?
          <CallList open={true}
                    caller={props.caller}
                    calls={props.calls}
                    onClose={() => setCallListOpen(false)}
          /> : null
      }
      {
        deleteDialogOpen ?
          <ConfirmDeleteDialog
            caller={props.caller}
            open={true}
            onDelete={handleDeleteConfirmed}
            onCancel={() => setDeleteDialogOpen(false)}
          /> : null
      }
    </div>
  )
}

EditableCaller.defaultProps = {
  onSelect: CallerListItem.defaultProps.onSelect,
  onSubmit: CallerEditForm.defaultProps.onSubmit,
  onDelete: () => undefined
};

function ConfirmDeleteDialog(props: {
  caller: Caller,
  open: boolean,
  onDelete: (caller: Caller) => void,
  onCancel: () => void
}) {
  const {caller, open, onDelete, onCancel} = props;

  return (
    <Dialog
      open={open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{"Delete Caller"}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Deleting caller {`(${caller.areaCode})${caller.number}`} will wipe all records of its {caller.calls} calls.
          This operation cannot be undone. Are you sure you want to proceed?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onDelete(caller)} color="primary">
          Yes
        </Button>
        <Button onClick={onCancel} color="primary" autoFocus>
          No
        </Button>
      </DialogActions>
    </Dialog>
  )
}