// @flow

import {Grid, Typography} from '@material-ui/core';
import {Map as IMap} from 'immutable';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import type {AsyncList} from '../actions/api';
import {CallerOrderings, clearCache, deleteCaller, fetchCallers, fetchCalls, patchCallers} from '../actions/api';
import {API_PARAMETERS} from './APIConfig';
import type {Call, Caller, CallerDelta} from '../types/domainTypes';
import CallerList from './CallerList';
import SimpleListMenu from './SimpleListMenu';

const OPTIONS = [
  {label: 'Most recent callers', api_parameter: CallerOrderings.last_call},
  {label: 'Callers with most calls', api_parameter: CallerOrderings.calls},
  {label: 'Callers added most recently', api_parameter: CallerOrderings.date_inserted}
];

type CallerPanelProps = {
  dispatch: Dispatch,
  callers: AsyncList<Caller>,
  calls: IMap<string, AsyncList<Call>>
}

function RecentCallers(props: CallerPanelProps) {

  const [ordering, setOrdering] = React.useState(0);
  const {dispatch, callers, calls} = props;

  useEffect(() => {
    // Bombs the cached object tree.
    dispatch(clearCache());

    let timer = setInterval(
      () => dispatch(fetchCallers(OPTIONS[ordering].api_parameter)),
      API_PARAMETERS.pollingInterval
    );

    return () => clearInterval(timer);
  }, []);

  function handleCallerEdit(delta: Array<CallerDelta>) {
    dispatch(patchCallers(delta));
  }

  function handleCallerDelete(caller: Caller) {
    dispatch(deleteCaller(caller));
  }

  function changeOrdering(index: number) {
    setOrdering(index);
  }

  function refreshCalls(caller: Caller) {
    // Eventually we should throttle this to avoid
    // refetching unless some time has passed.
    dispatch(fetchCalls(caller));
  }

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={6} style={{display: 'flex', alignItems: 'center'}}>
          <Typography variant='h6' style={{padding: '8px'}}>
            Recent Callers
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <SimpleListMenu
            options={OPTIONS.map(entry => entry.label)}
            initial={0}
            onChange={changeOrdering}
          />
        </Grid>
        <Grid item xs={12}>
          <CallerList
            callers={callers}
            calls={calls}
            onCallerEdit={handleCallerEdit}
            onCallDisplay={refreshCalls}
            onCallerDelete={handleCallerDelete}
          />
        </Grid>
      </Grid>
    </div>
  )
}

export default connect((state) => state)(RecentCallers);