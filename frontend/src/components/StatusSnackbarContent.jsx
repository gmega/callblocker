// @flow

import {amber, green} from '@material-ui/core/colors';
import IconButton from '@material-ui/core/IconButton';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import {makeStyles} from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CloseIcon from '@material-ui/icons/Close';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import type {Node} from 'react';

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const useStyles = makeStyles(theme => ({
  success: {
    backgroundColor: green[600],
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  info: {
    backgroundColor: theme.palette.primary.main,
  },
  warning: {
    backgroundColor: amber[700],
  },
  content: {
    flexWrap: 'nowrap'
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center'
  },
}));

export function StatusSnackbarContent(props: {
  className: string,
  message: Node,
  onClose: () => void,
  variant: 'success' | 'warning' | 'error' | 'info'
}) {
  const classes = useStyles();
  const {className, message, onClose, variant, ...other} = props;
  const Icon = variantIcon[variant];

  return (
    <SnackbarContent
      className={clsx(classes[variant], classes.content, className)}
      aria-describedby='client-snackbar'
      message={
        <span id='client-snackbar' className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)}/>
          {message}
        </span>
      }
      action={[
        <IconButton key='close' aria-label='Close' color='inherit' onClick={onClose}>
          <CloseIcon className={classes.icon}/>
        </IconButton>,
      ]}
      {...other}
    />
  );
}

StatusSnackbarContent.defaultProps = {
  className: '',
  onClose: () => undefined
};
