import { EventEmitter } from '@suika/common';

interface Events {
  added(img: HTMLImageElement): void;
}

export class ImgManager {
  private eventEmitter = new EventEmitter<Events>();

  private imgMap = new Map<string, HTMLImageElement>();
  private loadingImgSet = new Set<string>();

  async addImg(url: string) {
    if (this.loadingImgSet.has(url)) {
      return;
    }
    if (this.getImg(url)) {
      return;
    }

    const img = new Image();
    img.src = url;

    await new Promise((resolve) => {
      img.onload = () => {
        this.loadingImgSet.delete(url);
        this.imgMap.set(url, img);
        this.eventEmitter.emit('added', img);
        resolve(img);
      };
      // TODO: fail handling
    });
  }

  getImg(url: string) {
    return this.imgMap.get(url);
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}
