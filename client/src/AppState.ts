import {observable, computed, action} from 'mobx';

export class Picture {
    public src: string;
    public width: number;
    public height: number;
    public aspectRatio: number;
    public lightboxImage: { src: string };

    constructor( src:string, width:number, height:number ) {
      this.src = src;
      this.width = width;
      this.height = height;
      this.aspectRatio = width / height;
      this.lightboxImage = { src };
    }
}

export class AppState {
    @observable public title: string = '六花の部屋のアルバム';
    @observable public isLogged: boolean = false;
    @observable public isAuthRejected: boolean = false;
    @observable public pictures?: Picture[] = null;

    @action
    public login(): void {
      this.isLogged = true;
    }

    @action
    public logout(): void {
      this.isLogged = false;
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
        if( this.pictures === null ) {
            this.pictures = [];
        }

        this.pictures = this.pictures.concat( newPictures );
    }
}
