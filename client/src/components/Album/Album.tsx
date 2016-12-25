import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {withRouter} from 'react-router';
import {Gallery} from './Gallery';
import {CircularProgress} from 'material-ui';

import * as API from '../../api';
import {AppState, Picture} from '../../AppState';

type itemPosition = 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
const pos: itemPosition = 'center';
const styles = {
  gallery: {
    display: 'flex',
    height: '100%'
  },
  loading: {
    display: 'flex',
    justifyContent: pos,
    alignItems: pos,
    flexDirection: 'row',
    width: '100%',
    height: '100%'
  },
  loadingText: {
    textAlign: 'center',
    marginLeft: '36px',
    fontSize: '36px'
  }
};

@withRouter
@inject('appState')
@observer
export class Album extends React.Component<{appState: AppState, params: { talkId: string }, router: any }, {}> {
  public componentDidMount() {
      const talkId = this.props.params.talkId;
      API.albums( talkId ).then( response => {
          if ( !response.ok ) {
              throw new Error( 'eeeeee' );
          }

          return response.json();
      }).then( (body:any) => {
          const newPictures = body.map( ( obj ) => {
              const src = obj.objectUrl;
              const width = Number(obj.width);
              const height = Number(obj.height);
              return new Picture( src, width, height );
          });
          this.props.appState.addPictures( newPictures );
          this.props.appState.authResolve();
          this.props.appState.login( talkId );
          return Promise.resolve( true );
      }).catch( error => {
          this.props.router.push(`/login/${talkId}`);
          return Promise.resolve( false );
      });
  }

  public render() {
    const loading = () => (
        <div style={styles.loading}>
          <CircularProgress size={64} thickness={5}/>
          <p style={styles.loadingText} >Loading ...</p>
        </div>
    );

    const gallery = () => (
        <div style={styles.gallery}>
          <Gallery appState={this.props.appState} disableLightbox={false} showImageCount={false} backdropClosesModal={false} />
        </div>
    );

    return this.props.appState.pictures === null ? loading() : gallery();
  }
}
