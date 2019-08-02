// @flow

import {Button, List, Paper} from '@material-ui/core';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Map as IMap, Set as ISet} from 'immutable';
import React from 'react';
import {isIOS, isSafari} from "react-device-detect";
import type {Call, Caller, CallerDelta} from '../types/domainTypes';
import EditableCaller from './EditableCaller';

// This should probably go somewhere else.
const SAFARI_LOWER_BAR = 64;

// Oh Safari... you make me miserable.
const MAX_LIST_HEIGHT = 250 + ((isSafari && isIOS) ? SAFARI_LOWER_BAR : 0);
const useStyles = makeStyles(theme => ({
  callerList: {
    maxHeight: `calc(100vh - ${MAX_LIST_HEIGHT}px)`,
    overflow: 'auto'
  }
}));

const ALL = (caller) => true;
const BLOCKED = (caller) => caller.block;
const UNBLOCKED = (caller) => !caller.block;
const SELECTED = (caller, selection) => selection.has(caller.fullNumber);

type CallerListProps = {|
  callers: Array<Caller>,
  calls: IMap<string, Array<Call>>,
  onCallerEdit: (delta: Array<CallerDelta>) => void,
  onSelectionChange: (selection: ISet<string>) => void,
  onCallDisplay: (caller: Caller) => void
|};


export default function CallerList(props: CallerListProps) {

  const classes = useStyles();

  const [selected, setSelected] = React.useState(new ISet());

  function callerSelected(caller: Caller, toggle: boolean) {
    setSelected(toggle ? selected.add(caller.fullNumber) : selected.delete(caller.fullNumber));
    props.onSelectionChange(selected);
  }

  function callerCount(predicate: (caller: Caller) => boolean) {
    return props.callers.filter(
      (caller) => predicate(caller) && SELECTED(caller, selected)
    ).length
  }

  function componentWillReceiveProps(nextProps: CallerListProps, nextContext: any): void {
    let currentCallers = ISet(props.callers.map(caller => caller.fullNumber));
    let newCallers = ISet(nextProps.callers.map(caller => caller.fullNumber));
    if (currentCallers !== newCallers) {
      pruneSelection(newCallers);
    }
  }

  function pruneSelection(newCallerIds: ISet<string>) {
    setSelected(selected.filter((callerId) => newCallerIds.has(callerId)));
  }

  function callerStatusUpdated(blockStatus: boolean) {
    let selectedCallers = props.callers.filter((caller) => SELECTED(caller, selected));
    props.onCallerEdit(
      selectedCallers.map((caller) => {
        return ({
          original: caller,
          block: blockStatus
        }: CallerDelta)
      })
    );
  }

  function handleSubmit(delta: CallerDelta) {
    props.onCallerEdit([delta]);
  }

  return (
    <div>
      <Paper elevation={0}>
        <List className={classes.callerList} dense={false}>
          {props.callers.map(caller =>
            <EditableCaller
              key={caller.fullNumber}
              caller={caller}
              calls={props.calls.get(caller.fullNumber, [])}
              onSelect={callerSelected}
              onSubmit={handleSubmit}
              selected={selected.has(caller.fullNumber)}
              onDisplayCalls={props.onCallDisplay}
            />)}
        </List>
      </Paper>
      <Button variant='contained'
              color='primary'
              disabled={callerCount(BLOCKED) === 0}
              onClick={() => callerStatusUpdated(false)}>
        {callerCount(ALL) > 1 ? 'Allow All' : 'Allow'}
      </Button>
      <Button variant='contained'
              color='secondary'
              disabled={callerCount(UNBLOCKED) === 0}
              style={{margin: 20}} //FIXME fix this
              onClick={() => callerStatusUpdated(true)}>
        {callerCount(ALL) > 1 ? 'Block All' : 'Block'}
      </Button>
    </div>
  )
}

CallerList.defaultProps = {
  onCallerEdit: (delta: Array<CallerDelta>) => undefined,
  onSelectionChange: (selection: ISet<string>) => undefined,
  onCallDisplay: (caller: Caller) => undefined
};