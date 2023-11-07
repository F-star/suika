import { parseHexToRGBA } from '../../../utils/color';
import { ITexture, TextureType } from '../../texture';
import { Rect } from '../rect';
import { ControlHandle } from './control_handle';
import { ICursor } from '../../cursor_manager';
import { normalizeDegree, rad2Deg } from '@suika/geo';
import { ITransformHandleType } from './type';

const getResizeCursor = (type: string, rotation: number): ICursor => {
  const dDegree = type === 'se' || type === 'nw' ? -45 : 45;
  const degree = rad2Deg(rotation) + dDegree;
  return { type: 'resize', degree };
};

export const getRotationCursor = (type: string, rotation: number): ICursor => {
  const dDegree = {
    neRotation: 45,
    seRotation: 135,
    swRotation: 225,
    nwRotation: 315,
  }[type]!;
  const degree = normalizeDegree(rad2Deg(rotation) + dDegree);
  return { type: 'rotation', degree };
};

export const createTransformHandles = (params: {
  size: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) => {
  const getDefaultAttrs = () => {
    const attrs: {
      x: number;
      y: number;
      width: number;
      height: number;
      fill: ITexture[];
      stroke: ITexture[];
      strokeWidth: number;
    } = {
      x: 0,
      y: 0,
      width: params.size,
      height: params.size,
      fill: [
        {
          type: TextureType.Solid,
          attrs: parseHexToRGBA(params.fill)!,
        },
      ],
      stroke: [
        {
          type: TextureType.Solid,
          attrs: parseHexToRGBA(params.stroke)!,
        },
      ],
      strokeWidth: 1,
    };
    return attrs;
  };

  /********************** resize handle  *******************/
  // north-west
  const nw = new ControlHandle({
    graph: new Rect({
      objectName: 'nw',
      ...getDefaultAttrs(),
    }),
    getCursor: getResizeCursor,
  });

  const ne = new ControlHandle({
    graph: new Rect({
      objectName: 'ne',
      ...getDefaultAttrs(),
    }),
    getCursor: getResizeCursor,
  });

  const se = new ControlHandle({
    graph: new Rect({
      objectName: 'se',
      ...getDefaultAttrs(),
    }),
    getCursor: getResizeCursor,
  });

  const sw = new ControlHandle({
    graph: new Rect({
      objectName: 'sw',
      ...getDefaultAttrs(),
    }),
    getCursor: getResizeCursor,
  });

  /************************* rotation handle  **********************/
  const nwRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'rotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    getCursor: getRotationCursor,
  });

  const neRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'rotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    getCursor: getRotationCursor,
  });

  const seRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'rotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    getCursor: getRotationCursor,
  });

  const swRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'rotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    getCursor: getRotationCursor,
  });

  return new Map<ITransformHandleType, ControlHandle>([
    ['nwRotation', nwRotation],
    ['neRotation', neRotation],
    ['seRotation', seRotation],
    ['swRotation', swRotation],
    ['nw', nw],
    ['ne', ne],
    ['se', se],
    ['sw', sw],
  ]);
};
