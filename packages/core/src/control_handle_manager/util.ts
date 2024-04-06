import { parseHexToRGBA } from '@suika/common';
import {
  checkTransformFlip,
  getTransformAngle,
  type ITransformRect,
  normalizeDegree,
  rad2Deg,
} from '@suika/geo';

import { type ICursor } from '../cursor_manager';
import { Rect } from '../graphs';
import { type IPaint, PaintType } from '../paint';
import { ControlHandle } from './control_handle';
import { type ITransformHandleType } from './type';

const getResizeCursor = (
  type: string,
  selectedBox: ITransformRect | null,
): ICursor => {
  if (!selectedBox) {
    return 'default';
  }
  if (selectedBox.height === 0) {
    // be considered as a line
    return 'move';
  }
  const rotation = getTransformAngle(selectedBox.transform);
  const isFlip = checkTransformFlip(selectedBox.transform);

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

  const degree = rad2Deg(rotation) + (isFlip ? -dDegree : dDegree);
  return { type: 'resize', degree };
};

export const getRotationCursor = (
  type: string,
  selectedBox: ITransformRect | null,
): ICursor => {
  if (!selectedBox) {
    return 'default';
  }
  const rotation = getTransformAngle(selectedBox.transform);
  const isFlip = checkTransformFlip(selectedBox.transform);
  let dDegree = 0;

  if (selectedBox.height === 0) {
    // be considered as a line
    dDegree = {
      neRotation: 90,
      seRotation: 90,
      swRotation: 270,
      nwRotation: 270,
    }[type]!;
  } else {
    dDegree = {
      neRotation: 45,
      seRotation: 135,
      swRotation: 225,
      nwRotation: 315,
    }[type]!;
  }
  const degree = normalizeDegree(
    rad2Deg(rotation) + (isFlip ? -dDegree : dDegree),
  );
  const r = { type: 'rotation', degree } as const;
  return r;
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
      fill: IPaint[];
      stroke: IPaint[];
      strokeWidth: number;
    } = {
      x: 0,
      y: 0,
      width: params.size,
      height: params.size,
      fill: [
        {
          type: PaintType.Solid,
          attrs: parseHexToRGBA(params.fill)!,
        },
      ],
      stroke: [
        {
          type: PaintType.Solid,
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
    isTransformHandle: true,
  });

  const ne = new ControlHandle({
    graph: new Rect({
      objectName: 'ne',
      ...getDefaultAttrs(),
    }),
    type: 'ne',
    padding: 3,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  const se = new ControlHandle({
    graph: new Rect({
      objectName: 'se',
      ...getDefaultAttrs(),
    }),
    type: 'se',
    padding: 3,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  const sw = new ControlHandle({
    graph: new Rect({
      objectName: 'sw',
      ...getDefaultAttrs(),
    }),
    type: 'sw',
    padding: 3,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  /************************* rotation handle  **********************/
  const rotationHandleSize = params.size * 2.5;
  const nwRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'nwRotation',
      ...getDefaultAttrs(),
      width: rotationHandleSize,
      height: rotationHandleSize,
      visible: false,
    }),
    type: 'nwRotation',
    getCursor: getRotationCursor,
    isTransformHandle: true,
  });

  const neRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'neRotation',
      ...getDefaultAttrs(),
      width: rotationHandleSize,
      height: rotationHandleSize,
      visible: false,
    }),
    type: 'neRotation',
    getCursor: getRotationCursor,
    isTransformHandle: true,
  });

  const seRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'seRotation',
      ...getDefaultAttrs(),
      width: rotationHandleSize,
      height: rotationHandleSize,
      visible: false,
    }),
    type: 'seRotation',
    getCursor: getRotationCursor,
    isTransformHandle: true,
  });

  const swRotation = new ControlHandle({
    graph: new Rect({
      objectName: 'swRotation',
      ...getDefaultAttrs(),
      width: rotationHandleSize,
      height: rotationHandleSize,
      visible: false,
    }),
    type: 'swRotation',
    getCursor: getRotationCursor,
    isTransformHandle: true,
  });

  /************* north/south/west/east ************/
  const hitTest = function (
    this: ControlHandle,
    x: number,
    y: number,
    tol: number,
    rect: ITransformRect | null,
  ) {
    if (!rect || rect.width === 0 || rect.height === 0) {
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
    isTransformHandle: true,
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
    isTransformHandle: true,
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
    isTransformHandle: true,
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
    isTransformHandle: true,
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
