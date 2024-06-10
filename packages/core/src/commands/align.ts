import { type SuikaGraphics } from '../graphs';
import { type ICommand } from './type';

export enum AlignType {
  Left = 'Left',
  HCenter = 'HCenter',
  Right = 'Right',
  Top = 'Top',
  VCenter = 'VCenter',
  Bottom = 'Bottom',
}

/**
 * Align Command
 *
 * reference: https://mp.weixin.qq.com/s/9mGZYP_EPL7r-JVjOwyotw
 */
export class AlignCmd implements ICommand {
  dx: number[] = [];
  dy: number[] = [];
  constructor(
    public desc: string,
    private elements: SuikaGraphics[],
    type: AlignType,
  ) {
    if (elements.length < 2) {
      throw new Error('you can not algin zero or one element');
    }
    const bBoxes = elements.map((item) => item.getBbox());
    const mixedBBox = bBoxes.reduce(
      (m, box) => {
        return {
          minX: Math.min(m.minX, box.minX),
          minY: Math.min(m.minY, box.minY),
          maxX: Math.max(m.maxX, box.maxX),
          maxY: Math.max(m.maxY, box.maxY),
        };
      },
      {
        minX: Number.MAX_SAFE_INTEGER,
        minY: Number.MAX_SAFE_INTEGER,
        maxX: Number.MIN_SAFE_INTEGER,
        maxY: Number.MIN_SAFE_INTEGER,
      },
    );

    switch (type) {
      case AlignType.Left: {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          this.dx[i] = mixedBBox.minX - bBoxes[i].minX;
          el.updateAttrs({ x: el.getX() + this.dx[i] });
        }
        break;
      }
      case AlignType.HCenter: {
        const centerX = mixedBBox.minX / 2 + mixedBBox.maxX / 2;
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          this.dx[i] = centerX - (bBoxes[i].minX / 2 + bBoxes[i].maxX / 2);
          el.updateAttrs({ x: el.getX() + this.dx[i] });
        }
        break;
      }
      case AlignType.Right: {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          this.dx[i] = mixedBBox.maxX - bBoxes[i].maxX;
          el.updateAttrs({ x: el.getX() + this.dx[i] });
        }
        break;
      }
      case AlignType.Top: {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          this.dy[i] = mixedBBox.minY - bBoxes[i].minY;
          el.updateAttrs({ y: el.getY() + this.dy[i] });
        }
        break;
      }
      case AlignType.VCenter: {
        const centerY = mixedBBox.minY / 2 + mixedBBox.maxY / 2;
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          this.dy[i] = centerY - (bBoxes[i].minY / 2 + bBoxes[i].maxY / 2);
          el.updateAttrs({ y: el.getY() + this.dy[i] });
        }
        break;
      }
      case AlignType.Bottom: {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          this.dy[i] = mixedBBox.maxY - bBoxes[i].maxY;
          el.updateAttrs({ y: el.getY() + this.dy[i] });
        }
        break;
      }
      default:
        console.warn('invalid type:', type);
        break;
    }
  }
  redo() {
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      el.updateAttrs({
        x: el.getX() + (this.dx[i] ?? 0),
        y: el.getY() + (this.dy[i] ?? 0),
      });
    }
  }
  undo() {
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      el.updateAttrs({
        x: el.getX() - (this.dx[i] ?? 0),
        y: el.getY() - (this.dy[i] ?? 0),
      });
    }
  }
}
