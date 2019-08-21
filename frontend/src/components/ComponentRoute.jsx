// @flow

import type {ComponentType} from 'react';
import React from 'react';
import {Route} from 'react-router-dom';

export default function ComponentRoute<P>(props: {
  routeId: string,
  path: string,
  onActivation: (routeId: string) => void,
  C: ComponentType<P>,
  componentProps: P
}) {
  return <Route path={props.path} render={() => {
    props.onActivation(props.routeId);
    return <props.C {...props.componentProps}/>;
  }}/>
}

ComponentRoute.defaultProps = {
  onActivation: () => undefined,
  componentProps: {}
};