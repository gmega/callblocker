// @flow

import React from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import ComponentRoute from './components/ComponentRoute';

const Settings = React.lazy(() => import('./components/Settings'));
const Phonebook = React.lazy(() => import('./components/Phonebook'));
const CallerPanel = React.lazy(() => import('./components/CallerPanel'));


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
      <ComponentRoute
        routeId='Phonebook'
        path='/phonebook'
        onActivation={props.onRouteActivation}
        C={Phonebook}
      />
      <ComponentRoute
        routeId='Settings'
        path='/settings'
        onActivation={props.onRouteActivation}
        C={Settings}
      />
    </Switch>)
}