// @flow

import {Button, Grid, List, makeStyles, Paper, Typography} from "@material-ui/core";
import React from "react";
import {API_PARAMETERS, ERROR_TYPES, fetchCallers, patchCallers} from "./api";
import type {Caller, CallerDelta} from './Caller';
import {EditableCaller, fromAPIObject, toAPIObject} from "./Caller";
import SimpleListMenu from "./SimpleListMenu";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    maxWidth: 752,
  },
  demo: {
    backgroundColor: theme.palette.background.paper,
  },
  title: {
    margin: theme.spacing(4, 0, 2),
  },
  button: {
    margin: theme.spacing(1)
  }
}));

const OPTIONS = [
  {label: 'Most recent callers', api_parameter: 'last_call'},
  {label: 'Callers with most calls', api_parameter: 'calls'},
  {label: 'Callers added most recently', api_parameter: 'date_inserted'}
];

const ERROR_MESSAGES = {
  'load_callers': {
    [ERROR_TYPES.network]: (response) => 'Failed to fetch items from backend server. Retrying...',
    [ERROR_TYPES.server]: (response) =>
      `Failed to fetch items from backend server: (${response.message})`
  },
  'update_callers': {
    [ERROR_TYPES.network]: (response) => 'Update operation failed (network error).',
    [ERROR_TYPES.server]: (response) =>
      `Update operation failed: ${response.message}`
  }
};

const ALL = (caller) => true;
const BLOCKED = (caller) => caller.block;
const UNBLOCKED = (caller) => !caller.block;
const SELECTED = (caller, selection) => selection.has(caller.fullNumber);


type CallerPanelState = {
  selection: Set<string>,
  callers: Array<Caller>,
  ordering: number
};

type CallerPanelProps = {
  onError: (errorMessage: string, errorKey: string) => void,
  onUpdate: (deltas: Array<CallerDelta>) => void
}

class CallerPanel extends React.Component<CallerPanelProps, CallerPanelState> {

  state = {
    selection: new Set(),
    callers: [],
    ordering: 0
  };

  timer = null;

  componentDidMount() {
    this.timer = setInterval(() => fetchCallers(
      'load_callers',
      OPTIONS[this.state.ordering].api_parameter,
      this.callersUpdatedByAPI,
      this.reportError
    ), API_PARAMETERS.pollingInterval);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
  }

  callersUpdatedByAPI = (callers: Array<Object>) => {
    let newCallers = callers.map(fromAPIObject);

    this.setState({
      ...this.state,
      callers: newCallers,
      selection: this.pruneSelection(newCallers)
    });
  };

  callerCount = (predicate: (caller: Caller) => boolean) => {
    return this.state.callers.filter(
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
    patchCallers(
      'update_callers',
      [toAPIObject(delta)],
      this.updateSuccessful,
      this.reportError
    )
  };

  updateBlockingStatus = (block: boolean) => {
    let selectedCallers = this.state.callers.filter((caller) => SELECTED(caller, this.state.selection));
    let patches = selectedCallers.map((caller) => {
      return ({
        original: caller,
        block: block
      }: CallerDelta)
    });

    patchCallers('update_callers', patches, this.updateSuccessful, this.reportError)
  };

  pruneSelection = (newCallers: Array<Caller>) => {
    let newCallerIds: Set<string> = new Set(newCallers.map((caller) => caller.fullNumber));
    let newSelection: Set<string> = new Set(this.state.selection);

    // Prunes stale IDs from selection.
    for (let selected of this.state.selection) {
      if (!newCallerIds.has(selected)) {
        newSelection.delete(selected);
      }
    }
    return newSelection;
  };

  updateSuccessful = (opId: string, patches: Array<CallerDelta>) => {
    this.props.onUpdate(patches);
  };

  changeOrdering = (index: number) => {
    this.setState({
      ...this.state,
      ordering: index
    });
  };

  reportError = (opId: string, response: Response, errorType: string) => {
    this.props.onError(
      ERROR_MESSAGES[opId][errorType](response), opId
    )
  };

  render() {
    return (
      <div>
        <Grid container spacing={2} style={{maxWidth: '50vw', minWidth: '440px'}}>
          <Grid container xs={6} alignItems="center" justifyContent="center">
            <Typography variant="h6" style={{padding: "8px"}}>
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
              <div className={useStyles.demo}>
                <Paper elevation="0">
                  <List style={{maxHeight: 'calc(100vh - 250px)', overflow: "auto"}} dense={false}>
                    {this.state.callers.map(caller =>
                      <EditableCaller
                        key={caller.fullNumber}
                        caller={caller}
                        onSelect={this.callerSelected}
                        onSubmit={this.callerModified}
                        selected={this.state.selection.has(caller.fullNumber)}
                      />)}
                  </List>
                </Paper>
                <Button variant="contained"
                        color="primary"
                        disabled={this.callerCount(BLOCKED) === 0}
                        onClick={() => this.updateBlockingStatus(false)}>
                  {this.callerCount(ALL) > 1 ? "Allow All" : "Allow"}
                </Button>
                <Button variant="contained"
                        color="secondary"
                        disabled={this.callerCount(UNBLOCKED) === 0}
                        style={{margin: 20}} //FIXME fix this
                        onClick={() => this.updateBlockingStatus(true)}>
                  {this.callerCount(ALL) > 1 ? "Block All" : "Block"}
                </Button>
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    )
  }
}

export default CallerPanel;