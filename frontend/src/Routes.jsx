// @flow

import React from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import ComponentRoute from './components/ComponentRoute';
import CallerPanel from './components/CallerPanel';
import type {CallerDelta} from './types/domainTypes';


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
        componentProps={{
          onError: props.onError,
          onUpdate: props.onCallerUpdate
        }}
      />
    </Switch>)
}