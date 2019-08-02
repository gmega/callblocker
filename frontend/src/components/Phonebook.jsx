import {Typography} from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import Paper from '@material-ui/core/Paper';
import {makeStyles} from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import {Map as IMap} from 'immutable';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {clearCache, fetchCallers, fetchCalls} from '../actions/api';
import type {Call, Caller} from '../types/domainTypes';
import CallerList from './CallerList';

const useStyles = makeStyles(theme => ({
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    width: 400
  },
  input: {
    marginLeft: 8,
    flex: 1,
  },
  iconButton: {
    padding: theme.spacing(1.1),
    display: 'flex'
  }
}));

function SearchInput(props: {
  onChange: (content: string) => void
}) {

  const [searchContent, setSearchContent] = React.useState('');

  const classes = useStyles();

  function handleChange(event) {
    setSearchContent(event.target.value);
    props.onChange(event.target.value);
  }

  return (
    <Paper className={classes.root}>
      <InputBase
        className={classes.input}
        placeholder="Search Phonebook"
        inputProps={{'aria-label': 'search phonebook'}}
        onChange={handleChange}
        value={searchContent}
      />
      <div className={classes.iconButton}>
        <SearchIcon htmlColor='gray'/>
      </div>
    </Paper>
  );
}

function Phonebook(props: {
  dispatch: Dispatch,
  callers: Array<Caller>,
  calls: IMap<string, Array<Call>>
}) {
  const {dispatch, callers, calls} = props;

  useEffect(() => {
    // Bombing the whole tree of cached objects is not the most efficient approach,
    // but it is the simplest.
    dispatch(clearCache());
    dispatch(fetchCallers('description'));
  }, []);

  function handleSearchUpdate(content: string) {
    dispatch(
      content ?
        fetchCallers('text_score', content) :
        fetchCallers('description')
    );
  }

  function handleCallDisplay(caller: Caller) {
    dispatch(fetchCalls(caller))
  }

  return (
    <div>
      <SearchInput onChange={handleSearchUpdate}/>
      <CallerList callers={callers} calls={calls} onCallDisplay={handleCallDisplay}/>
    </div>
  )
}

export default connect((state) => state.apiObjects)(Phonebook);