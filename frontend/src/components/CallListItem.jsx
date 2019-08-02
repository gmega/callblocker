import {Typography} from '@material-ui/core';
import {blue} from '@material-ui/core/colors';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {CallReceived, Cancel} from '@material-ui/icons';
import moment from 'moment';
import React from 'react';
import {isMobile} from "react-device-detect";
import {formatTime} from '../helpers';
import type {Call} from '../types/domainTypes';

const useStyles = makeStyles(theme => ({
  selectedListItem: {
    backgroundColor: '#AFB9FF'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1)
  },
  listItemIcon: {
    marginRight: theme.spacing(2)
  }
}));

export default (props: { call: Call }) => {

  const classes = useStyles();

  const [isSelected, setSelected] = React.useState(false);

  const hoverHandlers = isMobile ? {} : {
    onMouseOver: () => setSelected(true),
    onMouseLeave: () => setSelected(false)
  };

  return (
    <div className={isSelected ? classes.selectedListItem : ''} {...hoverHandlers}>
      <div className={classes.listItem}>
        {props.call.blocked ?
          <Cancel className={classes.listItemIcon} htmlColor='#792E33' fontSize='large'/> :
          <CallReceived className={classes.listItemIcon} htmlColor='green' fontSize='large'/>}
        <Typography variant='caption' color='textSecondary'>
          {props.call.blocked ? 'blocked' : 'received'} {formatTime(moment(props.call.time))}</Typography>
      </div>
    </div>
  )
}