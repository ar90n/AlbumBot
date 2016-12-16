import * as React from 'react';
import {observer, inject} from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import {Link} from 'react-router';
import {AppState} from '../../AppState';

import {AppBar, IconButton, FlatButton } from 'material-ui';
import NavigationClose from 'material-ui/svg-icons/navigation/close';

class Refresh extends React.Component< {}, {} > {
  public static muiName: string  = 'FlatButton';
  public render() {
    return (
      <FlatButton {...this.props}>更新</FlatButton>
    );
  }
}

class Logout extends React.Component< {}, {} > {
  public static muiName: string = 'FlatButton';
  public render() {
    return (
      <FlatButton
        {...this.props}
        containerElement={<Link to='logout' />}
        linkButton={true}
        label='ログアウト' />
    );
  }
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%'
  }
};

@inject('appState')
@observer
export class App extends React.Component<{children: any, appState: AppState}, {}> {
  public render() {
    return (
        <div style={styles.root}>
          <AppBar
            title={this.props.appState.title}
            iconElementLeft={<IconButton><NavigationClose /></IconButton>}
            iconElementRight={this.props.appState.isLogged ? <Logout /> : <div />}
          />
          {this.props.children}
          <DevTools />
        </div>
      );
    }
}
