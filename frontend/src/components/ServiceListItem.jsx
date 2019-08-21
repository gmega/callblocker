// @flow

import {
  Button,
  Divider,
  ExpansionPanel,
  ExpansionPanelActions,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Typography,
} from '@material-ui/core';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Autorenew, Cancel, CheckCircle, ExpandMore, PlayArrow, Stop, Warning} from '@material-ui/icons';
import clsx from 'clsx';
import React from 'react';
import type {Service} from '../types/domainTypes';
import {ServiceState} from '../types/domainTypes';
import Nop from './Nop';


const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
  },
  healthIcon: {
    marginRight: theme.spacing(1)
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(1)
  },
  listItemText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
}));


type ServiceItemProps = {|
  service: Service,
  onStart: (service: Service) => void,
  onStop: (service: Service) => void
|}


const MODES = {
  [ServiceState.INITIAL]: {
    message: 'Not initialized',
    icon: (classes) => <Cancel className={classes.healthIcon} htmlColor='gray'/>,
    details: (props: ServiceItemProps) => <ErroredService {...props}/>
  },
  [ServiceState.STARTING]: {
    message: 'Service is starting',
    icon: (classes) => <Warning className={classes.healthIcon} htmlColor='#FEA200'/>,
    details: (props: ServiceItemProps) => <HealthyService {...props} stoppable disabled/>
  },
  [ServiceState.READY]: {
    message: 'Service is healthy',
    icon: (classes) => <CheckCircle className={classes.healthIcon} htmlColor='green'/>,
    details: (props: ServiceItemProps) => <HealthyService {...props} stoppable/>
  },
  [ServiceState.STOPPING]: {
    message: 'Service is stopping',
    icon: (classes) => <Warning className={classes.healthIcon} htmlColor='#FEA200'/>,
    details: (props: ServiceItemProps) => <HealthyService {...props} startable disabled/>
  },
  [ServiceState.TERMINATED]: {
    message: 'Service is stopped',
    icon: (classes) => <Cancel className={classes.healthIcon} htmlColor='gray'/>,
    details: (props: ServiceItemProps) => <HealthyService {...props} startable/>
  },
  [ServiceState.ERRORED]: {
    message: 'Service not healthy',
    icon: (classes) => <Cancel className={classes.healthIcon} htmlColor='#B71C1C'/>,
    details: (props: ServiceItemProps) => <ErroredService service={props.service} onStart={props.onStart}/>
  }
};

export default function ServiceList(props: ServiceItemProps) {
  const classes = useStyles();

  const [expanded, setExpanded] = React.useState(false);

  const service = props.service;
  const mode = MODES[service.status.state];

  return (
    <ExpansionPanel square expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <ExpansionPanelSummary expandIcon={<ExpandMore/>} style={{alignContent: 'center'}}>
        {mode.icon(classes)}
        <Typography className={clsx(classes.heading, classes.listItemText)}>{service.name}</Typography>
        <Typography className={classes.secondaryHeading}>{mode.message}</Typography>
      </ExpansionPanelSummary>
      {mode.details(props)}
    </ExpansionPanel>
  )
}

ServiceList.defaultProps = {
  onStart: (service: Service) => undefined,
  onStop: (service: Service) => undefined,
};


export function HealthyService(props: {
  service: Service,
  startable: boolean,
  stoppable: boolean,
  disabled: boolean,
  onStart: (service: Service) => void,
  onStop: (service: Service) => void
}) {
  const service = props.service;
  return (
    <Nop>
      <Divider/>
      <ExpansionPanelActions>
        <div>
          {props.stoppable ?
            <Button size='small' variant='contained' disabled={props.disabled} onClick={() => props.onStop(service)}>
              <Stop/>Stop</Button> : null}
          {props.startable ?
            <Button size='small' variant='contained' disabled={props.disabled} onClick={() => props.onStart(service)}>
              <PlayArrow/>Start</Button> : null}
        </div>
      </ExpansionPanelActions>
    </Nop>
  )
}

HealthyService.defaultProps = {
  startable: false,
  stoppable: false,
  disabled: false,
};

export function ErroredService(props: {
  service: Service,
  onStart: (service: Service) => void
}) {
  const service = props.service;
  const traceback = service.status.traceback ? service.status.traceback : [];
  return (
    <Nop>
      <ExpansionPanelDetails>
        <div style={{overflow: 'auto'}}>
          <Typography>Service died with
            <span style={{fontWeight: 'bold'}}>
              {service.status.exception}:
            </span>
          </Typography>
          <pre> {
            traceback.map((frame, index) => {
              return (
                <div key={index} style={{backgroundColor: index % 2 ? '#FDFFDF' : '#EDEDF0'}}>{frame}</div>
              )
            })
          }
          </pre>
        </div>
      </ExpansionPanelDetails>
      <Divider/>
      <ExpansionPanelActions>
        <div>
          <Button size='small' variant='contained' onClick={() => props.onStart(service)}><Autorenew/>Restart</Button>
        </div>
      </ExpansionPanelActions>
    </Nop>
  )
}
