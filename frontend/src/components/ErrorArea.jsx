// @flow

import makeStyles from '@material-ui/core/styles/makeStyles';
import React from "react";

const useStyles = makeStyles(theme => ({
  errorArea: {
    backgroundColor: '#ff7272',
    color: 'white',
    padding: '1em'
  }
}));

export function ErrorArea(props: { errors: Map<string, string> }) {
  const classes = useStyles();

  if (props.errors.size) {
    return (
      <div className={classes.errorArea}>
        {[...props.errors.entries()].map(([key, value]) => <div key={key}>{value}</div>)}
      </div>
    )
  } else {
    return <div></div>;
  }
}
