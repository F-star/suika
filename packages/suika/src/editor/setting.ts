import EventEmitter from '../utils/event_emitter';
import { ITexture, TextureType } from './texture';

interface Events {
  update(attrs: SettingValue): void;
}

export class Setting {
  private eventEmitter = new EventEmitter<Events>();
  private value = {
    /***** texture ****/
    canvasBgColor: '#f4f4f4',
    firstStroke: {
      type: TextureType.Solid,
      attrs: { r: 0, g: 0, b: 0, a: 1 },
    } as ITexture,
    strokeWidth: 1,

    firstFill: {
      type: TextureType.Solid,
      attrs: { r: 217, g: 217, b: 217, a: 1 },
    } as ITexture,

    addedTexture: {
      type: TextureType.Solid,
      attrs: { r: 0, g: 0, b: 0, a: 0.2 },
    } as ITexture,

    guideBBoxStroke: '#1592fe',
    selectionStroke: '#0f8eff',
    selectionFill: '#0f8eff33',
    selectionMode: 'intersect' as 'intersect' | 'contain',

    // 点选时，加一个 padding，使得点选更容易
    selectionHitPadding: 4,

    highlightLayersOnHover: true,
    hoverOutlineStrokeWidth: 2,
    hoverOutlineStroke: '#1592fe',

    selectedOutlineStrokeWidth: 1,

    /******** transform ********/
    handleStroke: '#1592fe',
    handleFill: '#fff',
    handleStrokeWidth: 2,
    handleHitToleration: 3,
    handleSize: 7,

    /********* text ********/
    defaultFontSize: 12,
    textFill: [
      {
        type: TextureType.Solid,
        attrs: { r: 0, g: 0, b: 0, a: 1 },
      },
    ] as ITexture[],

    lockRotation: Math.PI / 12, // 旋转时，通过 shift 约束旋转角度为该值的整数倍。

    zoomStep: 0.27, // 缩放比例步长
    zoomMax: 256,
    zoomMin: 0.02,

    drawGraphDefaultWidth: 100, // drawing graph default width if no drag
    drawGraphDefaultHeight: 100, // default height

    /**** 标尺相关 ****/
    enableRuler: true,
    minStepInViewport: 50, // 视口区域下的最小步长
    rulerBgColor: '#fff',
    rulerStroke: '#e6e6e6',
    rulerMarkStroke: '#c1c1c1',
    rulerWidth: 20, // 宽度
    rulerMarkSize: 4, // 刻度高度

    /**** 网格相关 ****/
    enablePixelGrid: true,
    snapToPixelGrid: true, // 是否吸附到像素网格
    minPixelGridZoom: 8, // draw pixel grid When zoom reach this value
    pixelGridLineColor: '#cccccc55', // pixel grid line color

    dragBlockStep: 4, // drag handler will not happen if move distance less this value

    offsetX: 0, // 鼠标坐标位置的修正值
    offsetY: 0,

    zoomToFixPadding: 32, // base viewport coord

    moveElementsStep: 1,
    moveElementsStepFast: 10,
    moveElementsDelay: 500,

    // reference line
    refLineTolerance: 4,
    refLineStroke: '#f14f30ee',
    refLineStrokeWidth: 1,
    refLinePointSize: 5,
  };

  set<K extends keyof Setting['value']>(key: K, value: Setting['value'][K]) {
    this.value[key] = value;
    this.eventEmitter.emit('update', this.getAttrs());
  }
  get<K extends keyof Setting['value']>(key: K) {
    return this.value[key];
  }
  getAttrs() {
    return { ...this.value };
  }

  on(eventName: 'update', handler: (value: Setting['value']) => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'update', handler: (value: Setting['value']) => void) {
    this.eventEmitter.off(eventName, handler);
  }
}

export type SettingValue = Setting['value'];
