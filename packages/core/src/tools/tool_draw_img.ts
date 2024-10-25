import { type IRect, normalizeRect } from '@suika/geo';

import { type SuikaEditor } from '../editor';
import { SuikaRect } from '../graphics';
import { PaintType } from '../paint';
import { DrawGraphicsTool } from './tool_draw_graphics';
import { type ITool } from './type';

interface ImgData {
  url: string;
  name: string;
}

const uploadImg = () => {
  return new Promise<ImgData>((resolve) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // only image

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setTimeout(() => {
          resolve({ url: src, name: file.name });
        });
      };
      reader.readAsDataURL(file);
    };

    fileInput.click();
  });
};

const TYPE = 'drawImg';
const HOTKEY = '';

export class DrawImgTool extends DrawGraphicsTool implements ITool {
  static override readonly type = TYPE;
  static override readonly hotkey = HOTKEY;
  override readonly type = TYPE;
  override readonly hotkey = HOTKEY;

  private imgData: ImgData | null = null;

  constructor(editor: SuikaEditor) {
    super(editor);
    this.commandDesc = 'Add Image';
  }

  async enableActive() {
    try {
      const imgData = await uploadImg();
      await this.editor.imgManager.addImg(imgData.url);
      this.imgData = imgData;
      return true;
    } catch (error) {
      return false;
    }
  }

  protected override createGraphics(rect: IRect) {
    rect = normalizeRect(rect);
    const graphics = new SuikaRect(
      {
        objectName: this.imgData!.name,
        width: rect.width,
        height: rect.height,
        fill: [
          {
            type: PaintType.Image,
            attrs: {
              src: this.imgData!.url,
            },
          },
        ],
      },
      {
        advancedAttrs: {
          x: rect.x,
          y: rect.y,
        },
        doc: this.editor.doc,
      },
    );
    return graphics;
  }
}
