import { EventEmitter, pick } from '@suika/common';

import { type IPaint, PaintType } from './paint';
import { type BooleanKeys } from './type';

interface Events {
  update(attrs: SettingValue, changedKey: keyof SettingValue): void;
}

export class Setting {
  private eventEmitter = new EventEmitter<Events>();
  private value = {
    /***** paint ****/
    canvasBgColor: '#f4f4f4',
    firstStroke: {
      type: PaintType.Solid,
      attrs: { r: 0, g: 0, b: 0, a: 1 },
    } as IPaint,
    strokeWidth: 1,

    firstFill: {
      type: PaintType.Solid,
      attrs: { r: 217, g: 217, b: 217, a: 1 },
    } as IPaint,
    firstFrameFill: {
      type: PaintType.Solid,
      attrs: { r: 255, g: 255, b: 255, a: 1 },
    } as IPaint,

    addedPaint: {
      type: PaintType.Solid,
      attrs: { r: 0, g: 0, b: 0, a: 0.2 },
    } as IPaint,

    defaultStarInnerScale: 0.3819660246372223,

    // selected box
    selectBoxStroke: '#1592fe',
    selectBoxStrokeWidth: 1.2,

    // size indicator
    sizeIndicatorMinSize: 10, // if length less this value, not render
    sizeIndicatorOffset: 10,
    sizeIndicatorRectRadius: 2,
    sizeIndicatorRectPadding: [0, 4, 0, 4],
    sizeIndicatorTextColor: '#fff',
    sizeIndicatorTextFontStyle: '12px sans-serif',
    sizeIndicatorNumPrecision: 2,

    selectionStroke: '#0f8eff',
    selectionFill: '#0f8eff33',
    selectionMode: 'intersect' as 'intersect' | 'contain',

    // 点选时，加一个 padding，使得点选更容易
    selectionHitPadding: 4,

    highlightLayersOnHover: true,
    hoverOutlineStrokeWidth: 2,
    hoverOutlineStroke: '#1592fe',

    selectedOutlineStrokeWidth: 1,

    /******** transform control handle ********/
    handleStroke: '#1592fe',
    handleFill: '#fcfcfc',
    handleStrokeWidth: 2,
    handleSize: 7,
    neswHandleWidth: 10, // north/east/south/west handle width

    /********* text ********/
    defaultFontSize: 12,
    defaultFontFamily: 'sans-serif', // 'Smiley Sans'
    textFill: [
      {
        type: PaintType.Solid,
        attrs: { r: 0, g: 0, b: 0, a: 1 },
      },
    ] as IPaint[],

    lockRotation: Math.PI / 12, // 旋转时，通过 shift 约束旋转角度为该值的整数倍。

    /*********** zoom *************/
    zoomStep: 0.2325,
    zoomMin: 0.015625,
    zoomMax: 256,
    zoomLevels: [
      0.015625, 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128,
      256,
    ],

    drawGraphDefaultWidth: 100, // drawing graphics default width if no drag
    drawGraphDefaultHeight: 100, // default height

    /**** ruler ****/
    enableRuler: false,
    minStepInViewport: 50, // 视口区域下的最小步长
    rulerBgColor: '#fff',
    rulerStroke: '#e6e6e6',
    rulerMarkStroke: '#c1c1c1',
    rulerSelectedBgColor: '#e6f5ff',
    rulerWidth: 20, // 宽度
    rulerMarkSize: 4, // 刻度高度

    /**** pixel grid ****/
    enablePixelGrid: true,
    snapToGrid: true, // 是否吸附到网格
    minPixelGridZoom: 8, // draw pixel grid When zoom reach this value
    pixelGridLineColor: '#cccccc55', // pixel grid line color

    gridViewX: 1,
    gridViewY: 1,
    gridSnapX: 1,
    gridSnapY: 1,

    snapToObjects: true,

    dragBlockStep: 4, // drag handler will not happen if move distance less this value

    offsetX: 0, // mouse offset
    offsetY: 0,

    /**** zoom ****/
    zoomToFixPadding: 40, // base viewport coord
    invertZoomDirection: false, // zoom in/out direction

    smallNudge: 1,
    bigNudge: 10,
    moveElementsDelay: 500, // ms

    // reference line
    refLineTolerance: 4,
    refLineStroke: '#f14f30ee',
    refLineStrokeWidth: 1,
    refLinePointSize: 5,

    /**** tool ****/
    keepToolSelectedAfterUse: false,
    pencilCurveFitTolerance: 1,

    /******** path control handle ******/
    pathLineStroke: '#a4a4a4',

    /**** angle ****/
    angleBase: { x: 0, y: -1 }, // no use now

    flipObjectsWhileResizing: true,

    comboClickMaxGap: 350, // millisecond
    comboClickDistanceTol: 5,

    textEditorCursorSize: 1.5,
    textEditorCursorLineStroke: '#000',
    textEditorSelectionFill: '#0069c433',
  };

  constructor(partialVal?: Partial<SettingValue>) {
    partialVal = pick(partialVal, Object.keys(this.value));
    this.value = {
      ...this.value,
      ...partialVal,
    };
  }

  toggle<K extends BooleanKeys<SettingValue>>(key: K) {
    const value = this.value[key];
    if (typeof value === 'boolean') {
      this.set(key, !value);
    } else {
      console.warn(`toggle ${key} failed, value is not boolean`);
    }
  }
  set<K extends keyof SettingValue>(key: K, value: SettingValue[K]) {
    this.value[key] = value;
    this.eventEmitter.emit('update', this.getAttrs(), key);
  }
  get<K extends keyof SettingValue>(key: K) {
    return this.value[key];
  }
  getAttrs(): SettingValue {
    return { ...this.value };
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}

export type SettingValue = Setting['value'];
