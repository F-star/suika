import { parseHexToRGBA } from '../../../utils/color';
import { ITexture, TextureType } from '../../texture';
import { Rect } from '../rect';
import { ControlHandle } from './control_handle';
import { ICursor } from '../../cursor_manager';
import { IRectWithRotation, normalizeDegree, rad2Deg } from '@suika/geo';
import { ITransformHandleType } from './type';

const getResizeCursor = (
  type: string,
  rotation: number,
  selectedBox: IRectWithRotation,
): ICursor => {
  if (selectedBox.height === 0) {
    // be considered as a line
    return 'move';
  }

  let dDegree = 0;
  switch (type) {
    case 'se':
    case 'nw':
      dDegree = -45;
      break;
    case 'ne':
    case 'sw':
      dDegree = 45;
      break;
    case 'n':
    case 's':
      dDegree = 0;
      break;
    case 'e':
    case 'w':
      dDegree = 90;
      break;
    default:
      console.warn('unknown type', type);
  }

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
    type: 'nw',
    padding: 3,
    getCursor: getResizeCursor,
  });

  const ne = new ControlHandle({
    graph: new Rect({
      objectName: 'ne',
      ...getDefaultAttrs(),
    }),
    type: 'ne',
    padding: 3,
    getCursor: getResizeCursor,
  });

  const se = new ControlHandle({
    graph: new Rect({
      objectName: 'se',
      ...getDefaultAttrs(),
    }),
    type: 'se',
    padding: 3,
    getCursor: getResizeCursor,
  });

  const sw = new ControlHandle({
    graph: new Rect({
      objectName: 'sw',
      ...getDefaultAttrs(),
    }),
    type: 'sw',
    padding: 3,
    getCursor: getResizeCursor,
  });

  /************************* rotation handle  **********************/
  const nwRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'nwRotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    type: 'nwRotation',
    getCursor: getRotationCursor,
  });

  const neRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'neRotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    type: 'neRotation',
    getCursor: getRotationCursor,
  });

  const seRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'seRotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    type: 'seRotation',
    getCursor: getRotationCursor,
  });

  const swRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'swRotation',
      ...getDefaultAttrs(),
      width: params.size * 2,
      height: params.size * 2,
      visible: false,
    }),
    type: 'swRotation',
    getCursor: getRotationCursor,
  });

  /************* north/south/west/east ************/
  const hitTest = function (
    this: ControlHandle,
    x: number,
    y: number,
    tol: number,
    rect: { x: number; y: number; width: number; height: number },
  ) {
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }
    return this.graph.hitTest(x, y, tol);
  };

  const n = new ControlHandle({
    graph: new Rect({
      objectName: 'n',
      ...getDefaultAttrs(),
      visible: false,
    }),
    type: 'n',
    hitTest,
    getCursor: getResizeCursor,
  });
  const e = new ControlHandle({
    graph: new Rect({
      objectName: 'e',
      ...getDefaultAttrs(),
      visible: false,
    }),
    type: 'e',
    hitTest,
    getCursor: getResizeCursor,
  });

  const s = new ControlHandle({
    graph: new Rect({
      objectName: 's',
      ...getDefaultAttrs(),
      visible: false,
    }),
    type: 's',
    hitTest,
    getCursor: getResizeCursor,
  });

  const w = new ControlHandle({
    graph: new Rect({
      objectName: 'w',
      ...getDefaultAttrs(),
      visible: false,
    }),
    type: 'w',
    hitTest,
    getCursor: getResizeCursor,
  });

  return new Map<ITransformHandleType, ControlHandle>([
    ['n', n],
    ['e', e],
    ['s', s],
    ['w', w],
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
