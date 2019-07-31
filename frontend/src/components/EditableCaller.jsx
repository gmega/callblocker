// @flow

import React from 'react';
import type {Call, Caller, CallerDelta} from '../types/domainTypes';
import CallerEditForm from './CallerEditForm';
import CallerListItem from './CallerListItem';
import {CallList} from './CallList';

export default function EditableCaller(props: {
  caller: Caller,
  calls: Array<Call>,
  selected: boolean,
  onDisplayCalls: (caller: Caller) => void,
  onSubmit: (delta: CallerDelta) => void,
  onSelect: (caller: Caller, selected: boolean) => void;
}) {

  const [editFormOpen, setEditFormOpen] = React.useState(false);
  (editFormOpen: boolean);

  const [callListOpen, setCallListOpen] = React.useState(false);
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

  function handleCallerClicked() {
    props.onDisplayCalls(props.caller);
    setCallListOpen(true);
  }

  return (
    <div>
      <CallerListItem {...props} onEdit={handleEditClicked} onSelect={props.onSelect} onClick={handleCallerClicked}/>
      <CallerEditForm {...props} open={editFormOpen} onSubmit={handleFormSubmitted}
                      onCancel={handleEditCancelled}/>
      <CallList open={callListOpen} caller={props.caller}
                calls={props.calls}
                onClose={() => setCallListOpen(false)}/>
    </div>
  )
}

EditableCaller.defaultProps = {
  onSelect: CallerListItem.defaultProps.onSelect,
  onSubmit: CallerEditForm.defaultProps.onSubmit
};
