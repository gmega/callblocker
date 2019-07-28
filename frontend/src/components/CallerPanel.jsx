// @flow

import {Button, Grid, List, Paper, Typography} from '@material-ui/core';
import React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {API_PARAMETERS, fetchCallers, patchCallers} from '../actions/api';
import type {Call, Caller, CallerDelta} from '../types/domainTypes';
import EditableCaller from './EditableCaller';
import SimpleListMenu from './SimpleListMenu';


const OPTIONS = [
  {label: 'Most recent callers', api_parameter: 'last_call'},
  {label: 'Callers with most calls', api_parameter: 'calls'},
  {label: 'Callers added most recently', api_parameter: 'date_inserted'}
];

const ALL = (caller) => true;
const BLOCKED = (caller) => caller.block;
const UNBLOCKED = (caller) => !caller.block;
const SELECTED = (caller, selection) => selection.has(caller.fullNumber);

type CallerPanelState = {
  selection: Set<string>,
  ordering: number
};

type CallerPanelProps = {
  dispatch: Dispatch,
  callers: Array<Caller>,
  calls: Map<string, Array<Call>>
}

class CallerPanel extends React.Component<CallerPanelProps, CallerPanelState> {

  state = {
    selection: new Set(),
    ordering: 0
  };

  timer = null;

  componentDidMount() {
    this.timer = setInterval(
      () => this.props.dispatch(fetchCallers(OPTIONS[this.state.ordering].api_parameter)),
      API_PARAMETERS.pollingInterval
    );
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
  }

  callerCount = (predicate: (caller: Caller) => boolean) => {
    return this.props.callers.filter(
      (caller) => predicate(caller) && SELECTED(caller, this.state.selection)
    ).length
  };

  callerSelected = (source: Caller, toggle: boolean) => {
    let newSelection = new Set(this.state.selection);
    if (toggle) {
      newSelection.add(source.fullNumber);
    } else {
      newSelection.delete(source.fullNumber)
    }

    this.setState({
      ...this.state,
      selection: newSelection
    });
  };

  callerModified = (delta: CallerDelta) => {
    this.props.dispatch(patchCallers([delta]));
  };

  updateBlockingStatus = (block: boolean) => {
    let selectedCallers = this.props.callers.filter((caller) => SELECTED(caller, this.state.selection));
    this.props.dispatch(
      patchCallers(
        selectedCallers.map((caller) => {
          return ({
            original: caller,
            block: block
          }: CallerDelta)
        })
      ));
  };

  componentWillReceiveProps(nextProps: CallerPanelProps, nextContext: any): void {
    let currentCallers = new Set(this.props.callers.map(caller => caller.fullNumber));
    let newCallers = new Set(nextProps.callers.map(caller => caller.fullNumber));
    if (currentCallers !== newCallers) {
      this.pruneSelection(newCallers);
    }
  }

  pruneSelection = (newCallerIds: Set<string>) => {
    let newSelection: Set<string> = new Set(this.state.selection);
    // Prunes stale IDs from selection.
    for (let selected of this.state.selection) {
      if (!newCallerIds.has(selected)) {
        newSelection.delete(selected);
      }
    }
    return newSelection;
  };

  changeOrdering = (index: number) => {
    this.setState({
      ...this.state,
      ordering: index
    });
  };

  render() {
    return (
      <div>
        <Grid container spacing={2} style={{maxWidth: '50vw', minWidth: '440px'}}>
          <Grid container xs={6} alignItems='center' justifyContent='center'>
            <Typography variant='h6' style={{padding: '8px'}}>
              Recent Callers
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <SimpleListMenu
              options={OPTIONS.map(entry => entry.label)}
              initial={0}
              onChange={this.changeOrdering}
            />
          </Grid>
          <Grid item xs={12}>
            <div>
              <div>
                <Paper elevation='0'>
                  <List style={{maxHeight: 'calc(100vh - 250px)', overflow: 'auto'}} dense={false}>
                    {this.props.callers.map(caller =>
                      <EditableCaller
                        key={caller.fullNumber}
                        caller={caller}
                        onSelect={this.callerSelected}
                        onSubmit={this.callerModified}
                        selected={this.state.selection.has(caller.fullNumber)}
                      />)}
                  </List>
                </Paper>
                <Button variant='contained'
                        color='primary'
                        disabled={this.callerCount(BLOCKED) === 0}
                        onClick={() => this.updateBlockingStatus(false)}>
                  {this.callerCount(ALL) > 1 ? 'Allow All' : 'Allow'}
                </Button>
                <Button variant='contained'
                        color='secondary'
                        disabled={this.callerCount(UNBLOCKED) === 0}
                        style={{margin: 20}} //FIXME fix this
                        onClick={() => this.updateBlockingStatus(true)}>
                  {this.callerCount(ALL) > 1 ? 'Block All' : 'Block'}
                </Button>
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    )
  }
}

export default connect((state) => state.apiObjects)(CallerPanel);