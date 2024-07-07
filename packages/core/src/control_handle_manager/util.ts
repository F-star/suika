import { parseHexToRGBA } from '@suika/common';
import {
  checkTransformFlip,
  getTransformAngle,
  type ITransformRect,
  Matrix,
  normalizeDegree,
  rad2Deg,
} from '@suika/geo';

import { HALF_PI } from '../constant';
import { type ICursor } from '../cursor_manager';
import { SuikaRect } from '../graphs';
import { type SuikaDocument } from '../graphs/document';
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

  if (type === 'n' || type === 's') {
    const heightTransform = new Matrix()
      .rotate(HALF_PI)
      .prepend(new Matrix(...selectedBox.transform))
      .rotate(HALF_PI);
    const heightRotate = getTransformAngle([
      heightTransform.a,
      heightTransform.b,
      heightTransform.c,
      heightTransform.d,
      heightTransform.tx,
      heightTransform.ty,
    ]);
    const degree = rad2Deg(heightRotate);
    return { type: 'resize', degree };
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

export const createTransformHandles = (
  params: {
    size: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
  },
  doc: SuikaDocument,
) => {
  const getDefaultAttrs = () => {
    const attrs: {
      width: number;
      height: number;
      fill: IPaint[];
      stroke: IPaint[];
      strokeWidth: number;
    } = {
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

  const opts = {
    doc,
    noCollectChange: true,
  };

  /********************** resize handle  *******************/
  // north-west
  const nw = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'nw',
        ...getDefaultAttrs(),
      },
      opts,
    ),
    type: 'nw',
    padding: 3,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  const ne = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'ne',
        ...getDefaultAttrs(),
      },
      opts,
    ),
    type: 'ne',
    padding: 3,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  const se = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'se',
        ...getDefaultAttrs(),
      },
      opts,
    ),
    type: 'se',
    padding: 3,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  const sw = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'sw',
        ...getDefaultAttrs(),
      },
      opts,
    ),
    type: 'sw',
    padding: 3,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  /************************* rotation handle  **********************/
  const rotationHandleSize = params.size * 2.5;
  const nwRotation = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'nwRotation',
        ...getDefaultAttrs(),
        width: rotationHandleSize,
        height: rotationHandleSize,
        visible: false,
      },
      opts,
    ),
    type: 'nwRotation',
    getCursor: getRotationCursor,
    isTransformHandle: true,
  });

  const neRotation = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'neRotation',
        ...getDefaultAttrs(),
        width: rotationHandleSize,
        height: rotationHandleSize,
        visible: false,
      },
      opts,
    ),
    type: 'neRotation',
    getCursor: getRotationCursor,
    isTransformHandle: true,
  });

  const seRotation = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'seRotation',
        ...getDefaultAttrs(),
        width: rotationHandleSize,
        height: rotationHandleSize,
        visible: false,
      },
      opts,
    ),
    type: 'seRotation',
    getCursor: getRotationCursor,
    isTransformHandle: true,
  });

  const swRotation = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'swRotation',
        ...getDefaultAttrs(),
        width: rotationHandleSize,
        height: rotationHandleSize,
        visible: false,
      },
      opts,
    ),
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
    return this.graphics.hitTest(x, y, tol);
  };

  const n = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'n',
        ...getDefaultAttrs(),
        visible: false,
      },
      opts,
    ),
    type: 'n',
    hitTest,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });
  const e = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'e',
        ...getDefaultAttrs(),
        visible: false,
      },
      opts,
    ),
    type: 'e',
    hitTest,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  const s = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 's',
        ...getDefaultAttrs(),
        visible: false,
      },
      opts,
    ),
    type: 's',
    hitTest,
    getCursor: getResizeCursor,
    isTransformHandle: true,
  });

  const w = new ControlHandle({
    graphics: new SuikaRect(
      {
        objectName: 'w',
        ...getDefaultAttrs(),
        visible: false,
      },
      opts,
    ),
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
