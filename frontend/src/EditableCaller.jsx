// @flow

import type {Caller, CallerDelta} from './Caller';
import CallerEditForm from './CallerEditForm';
import CallerListItem from './CallerListItem';
import React from 'react';

export default function EditableCaller(props: {
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
