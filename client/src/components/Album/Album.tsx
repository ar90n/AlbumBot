import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {withRouter} from 'react-router';
import * as Gallery from 'react-photo-gallery/lib/Gallery.js';

import * as API from '../../api';
import {AppState, Picture} from '../../AppState';

@withRouter
@inject('appState')
@observer
export class Album extends React.Component<{appState: AppState, params: { talkId: string }, router: any }, {}> {
  public componentDidMount() {
      const talkId = this.props.params.talkId;
      API.albums( talkId ).then( response => {
          if ( !response.ok ) {
              this.props.router.push(`/auth/${talkId}`);
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
        <div> loading </div>
    );

    const gallery = (
        <div>
          <Gallery photos={this.props.appState.pictures} />
        </div>
    );

    return this.props.appState.pictures === null ? loading : gallery;
  }
}
