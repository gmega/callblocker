import {Fab, InputBase, Paper, Tooltip} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import {Add, Search} from '@material-ui/icons';
import {Map as IMap} from 'immutable';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {clearCache, createCaller, fetchCallers, fetchCalls} from '../actions/api';
import type {Call, Caller, NewCaller} from '../types/domainTypes';
import CallerList from './CallerList';
import CallerNewForm from './CallerNewForm';

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
        <Search htmlColor='gray'/>
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

  const [addCallerOpen, setAddCallerOpen] = React.useState(false);

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

  function handleNewCaller(caller: NewCaller) {
    dispatch(createCaller(caller));
    dispatch(fetchCallers('description'));
    setAddCallerOpen(false);
  }

  return (
    <div>
      <SearchInput onChange={handleSearchUpdate}/>
      <CallerList callers={callers} calls={calls} onCallDisplay={handleCallDisplay}/>
      <CallerNewForm open={addCallerOpen}
                     onCancel={() => setAddCallerOpen(false)}
                     onSubmit={handleNewCaller}/>
      <Tooltip title='Add contact'>
        <Fab color='secondary' aria-label='add' onClick={() => setAddCallerOpen(true)} style={{
          margin: 0,
          top: 'auto',
          right: 20,
          bottom: 20,
          left: 'auto',
          position: 'fixed'
        }}>
          <Add/>
        </Fab>
      </Tooltip>
    </div>
  )
}

export default connect((state) => state.apiObjects)(Phonebook);