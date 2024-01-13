import { EventEmitter } from '@suika/common';

export class ImgManager {
  eventEmitter = new EventEmitter<{
    added(img: HTMLImageElement): void;
  }>();

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
}
