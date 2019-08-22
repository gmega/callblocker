// @flow

import {Paper} from '@material-ui/core';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import type {AsyncList} from '../actions/api';
import {fetchLog} from '../actions/api';
import type {LogEntry} from '../types/domainTypes';
import {API_PARAMETERS} from './APIConfig';
import AsyncListView from './AsyncListView';

export type LogViewerProps = {
  dispatch: Dispatch,
  log: AsyncList<LogEntry>
}


export function LogEntryList(props: LogViewerProps) {

  const {dispatch, log} = props;

  useEffect(() => {
    const intervalId = setInterval(
      () => dispatch(fetchLog()), API_PARAMETERS.pollingInterval
    );
    return () => clearInterval(intervalId);
  }, []);


  function renderLogEntries(entries: Array<LogEntry>) {
    return (
      <Paper style={{overflow: 'auto', maxHeight: '33vh'}}>
        <pre style={{marginTop: 0, marginBottom: 0}}>
          {entries.map((record) => `${record}\n`)}
        </pre>
      </Paper>
    )
  }

  return (
    <AsyncListView
      list={log}
      listRender={renderLogEntries}
      emptyMessage={'No log entries available.'}
    />
  )
}

export default connect((state) => state)(LogEntryList);

