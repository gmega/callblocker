// @flow

import React from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import CallerPanel from './components/CallerPanel';
import ComponentRoute from './components/ComponentRoute';


export default (props: {
  onRouteActivation: (routeId: string) => void
}) => {
  return (
    <Switch>
      <Route exact path='/' render={() => (<Redirect to='/callers'/>)}/>
      <ComponentRoute
        routeId='Recent Callers'
        path='/callers'
        onActivation={props.onRouteActivation}
        C={CallerPanel}
      />
    </Switch>)
}