import 'reset-css/reset.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Provider} from 'mobx-react';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin = require('react-tap-event-plugin');

import {App, Error, Album, Login} from './components';
import {AppState} from './AppState';

injectTapEventPlugin();

const appState =  new AppState();
const root = (
  <MuiThemeProvider>
    <Provider appState={appState}>
      <Router history={browserHistory}>
        <Route path='/' component={App} >
          <IndexRoute component={Error} />
          <Route path='album/:talkId' component={Album} />
          <Route path='login/:talkId' component={Login} />
          <Route path='*' component={Error} />
        </Route>
      </Router>
    </Provider>
  </MuiThemeProvider>
);

ReactDOM.render( root, document.getElementById('root'));
