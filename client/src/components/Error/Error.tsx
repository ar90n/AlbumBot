import * as React from 'react';
import {Link} from 'react-router';

type itemPosition = 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
const pos: itemPosition = 'center';
const style = {
  display: 'flex',
  justifyContent: pos,
  alignItems: pos,
  flexDirection: 'column',
  marginTop: '240px'
};

export class Error extends React.Component<{}, {}> {
  public render() {
    return (
      <div style={style}>
        <p>不正なアルバムへのリクエストです．</p>
        <p>URLを確認の上，再度アクセスをお願いします．</p>
        <Link to='/login/1234' >login</Link>
      </div>
    );
  }
}