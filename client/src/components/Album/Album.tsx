import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {withRouter} from 'react-router';
import * as Gallery from 'react-photo-gallery/lib/Gallery.js';
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
}

@withRouter
@inject('appState')
@observer
export class Album extends React.Component<{appState: AppState, params: { talkId: string }, router: any }, {}> {
  public componentDidMount() {
      const talkId = this.props.params.talkId;
      API.albums( talkId ).then( response => {
          if ( !response.ok ) {
              this.props.router.push(`/login/${talkId}`);
              return;
          }

          let body = '';
          const reader = response.body.getReader();
          const readChunks = ( result ) => {
              if ( result.done ) {
                  const newPictures = JSON.parse( body ).map( ( obj ) => {
                      const src = obj.objectUrl;
                      const width = Number(obj.width);
                      const height = Number(obj.height);
                      return new Picture( src, width, height );
                  });
                  this.props.appState.addPictures( newPictures );
                  return;
              }

              body += String.fromCharCode.apply( null, result.value );
              return reader.read().then(readChunks);
          };
          reader.read().then( readChunks );
      });
  }

  public render() {
    const loading = (
        <div style={styles.loading}>
          <CircularProgress size={64} thickness={5}/>
          <p style={styles.loadingText} >Loading ...</p>
        </div>
    );

    const gallery = (
        <div style={styles.gallery}>
          <Gallery photos={this.props.appState.pictures} />
        </div>
    );

    return this.props.appState.pictures === null ? loading : gallery;
  }
}
