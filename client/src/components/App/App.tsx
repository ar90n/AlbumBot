import * as React from 'react';
import {observer, inject} from 'mobx-react';
//import DevTools from 'mobx-react-devtools';
import {withRouter} from 'react-router';
import * as API from '../../api';
import {AppState} from '../../AppState';

import {AppBar, FlatButton } from 'material-ui';

class Refresh extends React.Component< {}, {} > {
  public static muiName: string  = 'FlatButton';
  public render() {
    return (
      <FlatButton {...this.props}>更新</FlatButton>
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

@withRouter
@inject('appState')
@observer
export class App extends React.Component<{children: any, appState: AppState, router: any}, {}> {
  private sendLogoutRequest() {
    if( this.props.appState.isLoggedTalkId !== null ) {
        const talkId: string = this.props.appState.isLoggedTalkId;
        API.logout( talkId ).then( response => {
            this.props.router.push(`/login/${talkId}`);
        });
    }
  }

  public render() {
    return (
        <div style={styles.root}>
          <AppBar
            title={this.props.appState.title}
            iconElementLeft={<div />}
            iconElementRight={this.props.appState.isLoggedTalkId ? <FlatButton label='ログアウト' onClick={()=>this.sendLogoutRequest()} /> : <div />}
          />
          {this.props.children}
        </div>
      );
    }
}
