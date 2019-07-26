//@ flow

import React from 'react';
import ReactDOM from 'react-dom';
import {applyMiddleware, createStore} from 'redux';
import NavDrawer from './components/NavDrawer';
import {BrowserRouter} from 'react-router-dom';
import {Provider} from 'react-redux';
import {rootReducer} from './reducers/index.js';
import thunk from 'redux-thunk';

const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

ReactDOM.render(
  <BrowserRouter>
    <Provider store={store}>
      <NavDrawer/>
    </Provider>
  </BrowserRouter>,
  document.getElementById('root')
);

