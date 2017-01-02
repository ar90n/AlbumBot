import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {withRouter} from 'react-router';
import * as Measure from 'react-measure';
import {Gallery} from './Gallery';
import {CircularProgress} from 'material-ui';

import * as API from '../../api';
import {AppState, Picture} from '../../AppState';

type itemPosition = 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
const pos: itemPosition = 'center';
const styles = {
  gallery: {
    display: 'flex',
    maxHeight: '100%'
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

function debounce(func: Function, wait: number, immediate?: boolean): (boolean) => void {
    let timeout: number;
    return function() {
        let context = this,
            args = arguments,
            later = (): void => {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            },
            callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}

@withRouter
@inject('appState')
@observer
export class Album extends React.Component<{appState: AppState, params: { talkId: string }, router: any }, {}> {
  private gallery?: any = null;
  private fetchPictures: any = () => Promise.resolve(true);

  public componentDidMount() {
    this.fetchPictures = debounce( (isForceFetch: boolean) => {
      const talkId = this.props.params.talkId;
      const lastEvaluatedCreatedAt = this.props.appState.lastEvaluatedCreatedAt;
      if( !lastEvaluatedCreatedAt && !isForceFetch ) {
        return Promise.resolve( true );
      }

      API.albums( talkId, lastEvaluatedCreatedAt ).then( response => {
          if ( !response.ok ) {
              throw new Error( 'login failed' );
          }

           return response.json();
      }).then( (body:any) => {
          this.props.appState.authResolve();
          this.props.appState.login( talkId );

          const resLastEvaluatedCreatedAt = body.lastEvaluatedCreatedAt;
          if( lastEvaluatedCreatedAt !== resLastEvaluatedCreatedAt ) {
            const newPictures = body.items.map( ( obj ) => {
                const src = obj.previewUrl;
                const width = Number(obj.previewWidth);
                const height = Number(obj.previewHeight);
                const lightboxSrc = obj.originalUrl;
                return new Picture( src, width, height, lightboxSrc );
            });
            this.props.appState.addPictures( newPictures, resLastEvaluatedCreatedAt );
          }
          return Promise.resolve( true );
      }).catch( error => {
        this.props.router.push(`/login/${talkId}`);
        return Promise.resolve( false );
      });
    }, 250 );
    const handleScroll = () => {
       const h = document.documentElement;
       const b = document.body;
       const st = 'scrollTop';
       const sh = 'scrollHeight';

       const percent = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
       if (95 <= percent ) {
         this.fetchPictures(false);
       }
     };

     window.addEventListener('scroll', handleScroll);
     this.fetchPictures(true);
  }

  public onMeasure( dim: any ) {
    const isFirstMeasure = this.props.appState.isFirstMeasure;
    const clientHeight = document.documentElement.clientHeight;
    if(( clientHeight == dim.bottom ) && !isFirstMeasure ) {
      this.props.appState.completeInitialLoad();
    }
    else {
       this.fetchPictures(false);
    }
    this.props.appState.completeFirstMeasure();
  }

  public render() {
    const loading = () => (
        <div style={styles.loading}>
          <CircularProgress size={64} thickness={5}/>
          <p style={styles.loadingText} >Loading ...</p>
        </div>
    );

    const gallery = () => (
        <Measure onMeasure={(dim) => this.onMeasure(dim)} shouldMeasure={!this.props.appState.isInitialLoadComplete}>
          <div style={styles.gallery}>
            <Gallery appState={this.props.appState} disableLightbox={false} showImageCount={false} backdropClosesModal={false} ref={(c)=>{this.gallery = c;}} />
          </div>
        </Measure>
    );

    return this.props.appState.pictures === null ? loading() : gallery();
  }
}
