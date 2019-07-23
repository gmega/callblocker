// @flow

import React from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import type {CallerDelta} from './Caller';
import CallerPanel from './CallerPanel';
import ComponentRoute from './ComponentRoute';


export default (props: {
  onRouteActivation: (routeId: string) => void,
  onError: (errorMessage: string, errorKey?: string) => void,
  onCallerUpdate: (updates: Array<CallerDelta>) => void
}) => {
  return (
    <Switch>
      <Route exact path="/" render={() => (<Redirect to="/callers"/>)}/>
      <ComponentRoute
        routeId="Recent Callers"
        path="/callers"
        onActivation={props.onRouteActivation}
        C={CallerPanel}
        componentProps={
          {
            onError: props.onError,
            onUpdate: props.onCallerUpdate
          }
        }
      />
    </Switch>)
}