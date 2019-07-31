// @flow

import {Button, Grid, List, Paper, Typography} from '@material-ui/core';
import {Map as IMap, Set as ISet} from 'immutable';
import React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {API_PARAMETERS, fetchCallers, fetchCalls, patchCallers} from '../actions/api';
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
  selection: ISet<string>,
  ordering: number
};

type CallerPanelProps = {
  dispatch: Dispatch,
  callers: Array<Caller>,
  calls: IMap<string, Array<Call>>
}

class CallerPanel extends React.Component<CallerPanelProps, CallerPanelState> {

  state = {
    selection: new ISet(),
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
    let selection = this.state.selection;
    this.setState({
      ...this.state,
      selection: toggle ? selection.add(source.fullNumber) : selection.delete(source.fullNumber)
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
    let currentCallers = ISet(this.props.callers.map(caller => caller.fullNumber));
    let newCallers = ISet(nextProps.callers.map(caller => caller.fullNumber));
    if (currentCallers !== newCallers) {
      this.pruneSelection(newCallers);
    }
  }

  pruneSelection = (newCallerIds: ISet<string>) => {
    return this.state.selection.filter((callerId) => newCallerIds.has(callerId));
  };

  changeOrdering = (index: number) => {
    this.setState({
      ...this.state,
      ordering: index
    });
  };

  refreshCalls = (caller: Caller) => {
    // Eventually we should throttle this to avoid
    // refetching unless some time has passed.
    this.props.dispatch(fetchCalls(caller));
  };

  render() {
    return (
      <div>
        <Grid container spacing={2} style={{minWidth: '350px'}}>
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
                        calls={this.props.calls.get(caller.fullNumber, [])}
                        onSelect={this.callerSelected}
                        onSubmit={this.callerModified}
                        selected={this.state.selection.has(caller.fullNumber)}
                        onDisplayCalls={(caller) => this.refreshCalls(caller)}
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