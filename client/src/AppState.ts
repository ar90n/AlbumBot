import {observable, computed, action} from 'mobx';

export class Picture {
    public src: string;
    public width: number;
    public height: number;
    public aspectRatio: number;
    public lightboxImage: { src: string };

    constructor( src: string, width: number, height: number ) {
      this.src = src;
      this.width = width;
      this.height = height;
      this.aspectRatio = width / height;
      this.lightboxImage = { src };
    }
}

export class AppState {
    @observable public title: string = 'アルバムBot';
    @observable public isLoggedTalkId?: string = null;
    @observable public isAuthRejected: boolean = false;
    @observable public pictures?: Picture[] = null;
    @observable public currentImage: number = 0;
    @observable public galleryWidth: number = 0;
    @observable public lightboxIsOpen: boolean = false;

    @action
    public login( talkId: string ): void {
      this.isLoggedTalkId = talkId;
    }

    @action
    public logout(): void {
      this.isLoggedTalkId = null;
    }

    @action
    public authResolve(): void {
        this.isAuthRejected = false;
    }

    @action
    public authReject(): void {
        this.isAuthRejected = true;
    }

    @action
    public addPictures( newPictures: Picture[] ): void {
        if ( this.pictures === null ) {
            this.pictures = [];
        }

        this.pictures = this.pictures.concat( newPictures );
    }

    @action
    public selectNextImage(): void {
        this.currentImage = Math.min( this.currentImage + 1, this.pictures.length - 1 );
    }

    @action
    public selectPrevImage(): void {
        this.currentImage = Math.max( 0, this.currentImage - 1 );
    }

    @action
    public setGalleryWidth( width: number ): void {
        this.galleryWidth = width;
    }

    @action
    public openLightbox( index: number ): void {
        this.currentImage = index;
        this.lightboxIsOpen = true;
    }

    @action
    public closeLightbox(): void {
        this.currentImage = 0;
        this.lightboxIsOpen = false;
    }
}
