// @flow

import type {ComponentType, Element} from 'react';
import {Route} from 'react-router-dom';
import React from 'react';

export default <P>(props: {
  routeId: string,
  path: string,
  onActivation: (routeId: string) => void,
  C: ComponentType<P>,
  componentProps: P
}) => {
  return <Route exact path={props.path} render={() => {
    props.onActivation(props.routeId);
    return <props.C {...props.componentProps}/>;
  }}/>
}