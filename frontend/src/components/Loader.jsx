// @flow

import {CircularProgress, makeStyles} from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import React from 'react';

const useStyles = makeStyles(theme => ({
  soloOuter: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(1)
  },
  soloInner: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'lightgray',
    padding: theme.spacing(2),
    borderStyle: 'solid',
    borderColor: 'gray'
  },
  soloSpinner: {
    marginRight: theme.spacing(2)
  },
  bareSpinner: {
    padding: theme.spacing(1)
  }
}));

export default function Loader(props: {
  variant: 'solo' | 'bare'
}) {
  const classes = useStyles();

  switch (props.variant) {
    case 'bare':
      return <CircularProgress className={classes.bareSpinner}/>;
    case 'solo':
      return (
        <div className={classes.soloOuter}>
          <div className={classes.soloInner}>
            <CircularProgress className={classes.soloSpinner}/>
            <Typography variant='subtitle1'>Loading...</Typography>
          </div>
        </div>
      );
    default:
      throw 'Invalid variant!';
  }
}

Loader.defaultProps = {
  variant: 'solo'
};
