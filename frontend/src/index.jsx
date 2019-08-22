import {SnackbarProvider} from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter} from 'react-router-dom';
import {applyMiddleware, createStore} from 'redux';
import thunk from 'redux-thunk';
import APIConfig from './components/APIConfig';
import Loader from './components/Loader';
import NavDrawer from './components/NavDrawer';
import {rootReducer} from './reducers/index.js';

const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

ReactDOM.render(
  <BrowserRouter>
    <React.Suspense fallback={<Loader variant='solo'/>}>
      <APIConfig/>
      <SnackbarProvider maxSnack={3}>
        <Provider store={store}>
          <NavDrawer/>
        </Provider>
      </SnackbarProvider>
    </React.Suspense>
  </BrowserRouter>,
  document.getElementById('root')
);

