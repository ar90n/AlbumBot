import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {Paper, TextField, RaisedButton, Checkbox } from 'material-ui';
import {withRouter} from 'react-router';
import * as API from '../../api';

import {AppState} from '../../AppState';

type itemPosition = 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
const pos: itemPosition = 'center';
const styles = {
    root: {
        display: 'flex',
        alignItems: pos,
        flexDirection: 'column',
        width: '100%',
        height: '100%'
    },
    topMessage: {
        margin: '60px',
        fontSize: '36px',
    },
    form: {
        width: '40%',
        padding: 20,
        margin: 20,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
    },
    errorMessage: {
        color: 'red',
        fontSize: '7px'
    },
    passField: {
        width: '100%',
    },
    checkbox: {
        textAlign: 'left',
        fontSize: '7px'
    },
    loginButton: {
        marginTop: '20px'
    }
};

@withRouter
@inject('appState')
@observer
export class Login extends React.Component<{appState: AppState, params: { talkId: string }, router: any }, {}> {
  private static VALUE_KEY: string  = 'value';
  private pass?: string = null;
  private keepPass: boolean = false;

  private sendLoginRequest() {
    if ( this.pass !== null ) {
        const talkId: string = this.props.params.talkId;
        API.login( this.props.params.talkId, this.pass ).then( response => {
            if ( response.ok ) {
                this.props.appState.authResolve();
                this.props.appState.login();
                this.props.router.push(`/album/${talkId}`);
            } else {
                this.props.appState.authReject();
            }
        });
    }
  }

  public render() {
    return (
      <div style={styles.root} >
        <p style={styles.topMessage}>合言葉を入力して下さい</p>
        <Paper style={styles.form} zDepth={2}>
          <div style={this.props.appState.isAuthRejected ? styles.errorMessage : {display:'none'}} >合言葉が間違っています</div>
          <TextField
            hintText='合言葉'
            floatingLabelText='合言葉'
            style={styles.passField}
            onChange={(e) => {this.pass = e.target[Login.VALUE_KEY];}}/>
          <Checkbox
            label='合言葉を保存'
            style={styles.checkbox}
            defaultChecked={this.keepPass}
            onCheck={(o,v) => {this.keepPass = v;}}/>
          <RaisedButton label='ログイン' primary={true} style={styles.loginButton} onClick={() => this.sendLoginRequest()} />
        </Paper>
      </div>
    );
  }
}
