import * as React from 'react';
import {observer, inject} from 'mobx-react';
import * as Lightbox from 'react-images';
import {AppState,Picture} from '../../AppState'

// Gallery image style
const style = {
    display: 'block',
    margin: 2,
    backgroundColor:'#e3e3e3',
    float: 'left'
}

@inject('appState')
@observer
export class Gallery extends React.Component< { appState: AppState, disableLightbox: boolean, showImageCount: boolean, backdropClosesModal: boolean }, any > {
    public static displayName:string = 'Gallery';
    private _gallery: any = null;

    public componentDidMount() {
        if( this._gallery !== null ) {
            const nextWidth = window.innerWidth;
            this.props.appState.setGalleryWidth( nextWidth );
        }
        window.addEventListener('resize', (e) => this.handleResize(e));
    }

    public componentWillUnmount() {
        window.removeEventListener('resize', (e) => this.handleResize(e), false);
    }

    private handleResize(e) {
        if( this._gallery !== null ) {
            const nextWidth = window.innerWidth;
            this.props.appState.setGalleryWidth( nextWidth );
        }
    }

    private openLightbox(index, event) {
        event.preventDefault();
        this.props.appState.openLightbox(index);
    }

    private closeLightbox(){
        this.props.appState.closeLightbox();
    }

    private gotoPrevious(){
        this.props.appState.selectPrevImage();
    }

    private gotoNext(){
        this.props.appState.selectNextImage();
    }

    public render(){
        const photos = this.props.appState.pictures;
        const containerWidth = this.props.appState.galleryWidth;
        const rowLimit =  (containerWidth >= 1024) ? 4 :
                          (containerWidth >= 480)  ? 2 :
                          1;
        let photoPreviewNodes = [];
        var contWidth = containerWidth - (rowLimit * 4); /* 4px for margin around each image*/
        contWidth = Math.floor(contWidth - 2); // add some padding to prevent layout prob
        var remainder = photos.length % rowLimit;
        if (remainder) { // there are fewer than rowLimit photos in last row
            var lastRowWidth = Math.floor(containerWidth - (remainder * 4) - 2);
            var lastRowIndex = photos.length - remainder;
        }
        var lightboxImages = [];
        for (var i=0;i<photos.length;i+=rowLimit) {
            var rowItems = [];
            // loop thru each set of rowLimit num
            // eg. if rowLimit is 3 it will  loop thru 0,1,2, then 3,4,5 to perform calculations for the particular set
            var aspectRatio=0,
                totalAr=0,
                commonHeight = 0;
            for (var j=i; j<i+rowLimit; j++){
                if (j == photos.length){
                    break;
                }
                totalAr += photos[j].aspectRatio;
            }
            if (i === lastRowIndex) {
                commonHeight = lastRowWidth / totalAr;
            } else {
                commonHeight = contWidth / totalAr;
            }
            // run thru the same set of items again to give the common height
            for (var k=i; k<i+rowLimit; k++){
                if (k == photos.length){
                    break;
                }
                var src = photos[k].src;

                if (this.props.disableLightbox){
                    photoPreviewNodes.push(
                        <div key={k} style={style}>
                        <img src={src} style={{display:'block', border:0}} height={commonHeight} width={commonHeight * photos[k].aspectRatio} alt="" />
                        </div>
                    );
                }
                else{
                    lightboxImages.push(photos[k].lightboxImage);
                    const kk = k
                    photoPreviewNodes.push(
                        <div key={k} style={style}>
                          <a href="#" className={String(k)} onClick={(e) => this.openLightbox(kk,e)}>
                            <img src={src} style={{display:'block', border:0}} height={commonHeight} width={commonHeight * photos[k].aspectRatio} alt="" />
                          </a>
                        </div>
                    );
                }
            }
        }
        return(
          <div id="Gallery" ref={(c) => this._gallery = c}>
            {photoPreviewNodes}
            {(() => !this.props.disableLightbox ? <Lightbox
                                                    currentImage={this.props.appState.currentImage}
                                                    images={lightboxImages}
                                                    isOpen={this.props.appState.lightboxIsOpen}
                                                    onClose={() => this.closeLightbox()}
                                                    onClickPrev={() => this.gotoPrevious()}
                                                    onClickNext={() => this.gotoNext()}
                                                    width={1600}
                                                    showImageCount={this.props.showImageCount}
                                                    backdropClosesModal={this.props.backdropClosesModal} />
                                                : null)()}
          </div>
        );
    }
};
