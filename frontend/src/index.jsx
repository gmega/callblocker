//@ flow

import React from 'react';
import ReactDOM from 'react-dom';
import NavDrawer from './NavDrawer';
import {BrowserRouter} from 'react-router-dom';

ReactDOM.render(
  <BrowserRouter>
    <NavDrawer/>
  </BrowserRouter>,
  document.getElementById('root')
);

