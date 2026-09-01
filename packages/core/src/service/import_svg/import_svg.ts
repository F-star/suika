import { genUuid, parseHexToRGBA } from '@suika/common';
import { boxToRect, GeoPath, type IPathItem } from '@suika/geo';
import svgpath from 'svgpath';

import { type GraphicsAttrs } from '../../graphics';
import { type IPaint, PaintType } from '../../paint';
import { GraphicsType } from '../../type';
import { svgToJson } from './svgToJson';
import { type Matrix, type SvgNode } from './types';

const multiplyTransform = (m1: Matrix, m2: Matrix): Matrix => [
  m1[0] * m2[0] + m1[2] * m2[1],
  m1[1] * m2[0] + m1[3] * m2[1],
  m1[0] * m2[2] + m1[2] * m2[3],
  m1[1] * m2[2] + m1[3] * m2[3],
  m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
  m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
];

const translate = (x: number, y: number): Matrix => [1, 0, 0, 1, x, y];

const INHERITED_PAINT_ATTRIBUTES = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-opacity',
  'stroke-width',
] as const;

type InheritedPaintAttributes = Partial<
  Record<(typeof INHERITED_PAINT_ATTRIBUTES)[number], string>
>;

const inheritPaintAttributes = (
  parentAttributes: InheritedPaintAttributes,
  attributes: Record<string, string>,
): InheritedPaintAttributes => {
  const inheritedAttributes = { ...parentAttributes };

  for (const name of INHERITED_PAINT_ATTRIBUTES) {
    if (attributes[name] !== undefined) {
      inheritedAttributes[name] = attributes[name];
    }
  }

  return inheritedAttributes;
};

const numberAttr = (attrs: Record<string, string>, name: string) =>
  Number.parseFloat(attrs[name] ?? '0') || 0;

const parseColor = (color: string | undefined, opacity = 1): IPaint[] => {
  if (!color || color === 'none') return [];

  const hex = color.startsWith('#') ? parseHexToRGBA(color) : null;
  if (hex) {
    return [
      {
        type: PaintType.Solid,
        attrs: { ...hex, a: hex.a * opacity },
      },
    ];
  }

  const match = color.match(
    /^rgba?\(\s*([\d.]+)[,\s]+\s*([\d.]+)[,\s]+\s*([\d.]+)(?:[,\s/]+\s*([\d.]+))?\s*\)$/i,
  );
  if (!match) return [];

  return [
    {
      type: PaintType.Solid,
      attrs: {
        // TODO: limit number range
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: Number(match[4] ?? 1) * opacity,
      },
    },
  ];
};

const getPaintAttrs = (node: SvgNode) => {
  const { attributes } = node;
  const opacity =
    attributes.opacity === undefined ? 1 : numberAttr(attributes, 'opacity');
  const fillOpacity =
    attributes['fill-opacity'] === undefined
      ? 1
      : numberAttr(attributes, 'fill-opacity');
  const strokeOpacity =
    attributes['stroke-opacity'] === undefined
      ? 1
      : numberAttr(attributes, 'stroke-opacity');

  return {
    // SVG fills shapes black by default. Lines are handled separately below.
    fill: parseColor(attributes.fill ?? '#000000', opacity * fillOpacity),
    stroke: parseColor(attributes.stroke, opacity * strokeOpacity),
    strokeWidth: numberAttr(attributes, 'stroke-width'),
  };
};

const makePathData = (d: string): IPathItem[] => {
  const pathData: IPathItem[] = [];
  let path: IPathItem | undefined;

  svgpath(d)
    .abs()
    .unshort()
    .unarc()
    .iterate((segment, _index, startX, startY) => {
      const command = segment[0].toUpperCase();
      const args = segment.slice(1) as number[];
      const addSegment = (
        x: number,
        y: number,
        incoming = { x: 0, y: 0 },
        outgoing = { x: 0, y: 0 },
      ) => {
        path?.segs.push({ point: { x, y }, in: incoming, out: outgoing });
      };

      if (command === 'M') {
        path = { segs: [], closed: false };
        pathData.push(path);
        addSegment(args[0], args[1]);
      } else if (command === 'L') {
        addSegment(args[0], args[1]);
      } else if (command === 'H') {
        addSegment(args[0], startY);
      } else if (command === 'V') {
        addSegment(startX, args[0]);
      } else if (command === 'C') {
        const previous = path?.segs.at(-1);
        if (previous) {
          previous.out = { x: args[0] - startX, y: args[1] - startY };
        }
        addSegment(args[4], args[5], {
          x: args[2] - args[4],
          y: args[3] - args[5],
        });
      } else if (command === 'Q') {
        const previous = path?.segs.at(-1);
        const [controlX, controlY, endX, endY] = args;
        if (previous) {
          previous.out = {
            x: ((controlX - startX) * 2) / 3,
            y: ((controlY - startY) * 2) / 3,
          };
        }
        addSegment(endX, endY, {
          x: ((controlX - endX) * 2) / 3,
          y: ((controlY - endY) * 2) / 3,
        });
      } else if (command === 'Z' && path) {
        path.closed = true;
      }
    });

  return pathData.filter((item) => item.segs.length > 0);
};

const normalizePath = (pathData: IPathItem[], transform: Matrix) => {
  const bbox = new GeoPath(pathData).getBbox();
  const bRect = boxToRect(bbox);

  for (const item of pathData) {
    for (const seg of item.segs) {
      seg.point.x -= bRect.x;
      seg.point.y -= bRect.y;
    }
  }

  return {
    pathData,
    width: bRect.width,
    height: bRect.height,
    transform: multiplyTransform(transform, translate(bRect.x, bRect.y)),
  };
};

const toGraphicsAttrs = (
  node: SvgNode,
  transform: Matrix,
): GraphicsAttrs | null => {
  const { attributes } = node;
  const paintAttrs = getPaintAttrs(node);
  const base = {
    id: genUuid(),
    objectName: node.type,
    ...paintAttrs,
  };

  switch (node.type.toLowerCase()) {
    case 'rect': {
      const x = numberAttr(attributes, 'x');
      const y = numberAttr(attributes, 'y');
      return {
        ...base,
        type: GraphicsType.Rect,
        width: numberAttr(attributes, 'width'),
        height: numberAttr(attributes, 'height'),
        cornerRadius: numberAttr(attributes, 'rx'),
        transform: multiplyTransform(transform, translate(x, y)),
      };
    }
    case 'circle':
    case 'ellipse': {
      const rx =
        node.type.toLowerCase() === 'circle'
          ? numberAttr(attributes, 'r')
          : numberAttr(attributes, 'rx');
      const ry =
        node.type.toLowerCase() === 'circle'
          ? rx
          : numberAttr(attributes, 'ry');
      return {
        ...base,
        type: GraphicsType.Ellipse,
        width: rx * 2,
        height: ry * 2,
        transform: multiplyTransform(
          transform,
          translate(
            numberAttr(attributes, 'cx') - rx,
            numberAttr(attributes, 'cy') - ry,
          ),
        ),
      };
    }
    case 'line': {
      const x1 = numberAttr(attributes, 'x1');
      const y1 = numberAttr(attributes, 'y1');
      const dx = numberAttr(attributes, 'x2') - x1;
      const dy = numberAttr(attributes, 'y2') - y1;
      const length = Math.hypot(dx, dy);
      if (!length) return null;
      return {
        ...base,
        type: GraphicsType.Line,
        fill: [],
        width: length,
        height: 0,
        transform: multiplyTransform(transform, [
          dx / length,
          dy / length,
          -dy / length,
          dx / length,
          x1,
          y1,
        ]),
      };
    }
    case 'polyline':
    case 'polygon': {
      const values = (
        attributes.points?.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) ??
        []
      ).map(Number);
      if (values.length < 4) return null;
      const pathData: IPathItem[] = [
        {
          closed: node.type.toLowerCase() === 'polygon',
          segs: values.reduce<IPathItem['segs']>((segs, value, index) => {
            if (index % 2 === 0 && values[index + 1] !== undefined) {
              segs.push({
                point: { x: value, y: values[index + 1] },
                in: { x: 0, y: 0 },
                out: { x: 0, y: 0 },
              });
            }
            return segs;
          }, []),
        },
      ];
      return {
        ...base,
        type: GraphicsType.Path,
        ...normalizePath(pathData, transform),
      };
    }
    case 'path': {
      const d = attributes.d;
      if (!d) return null;
      const pathData = makePathData(d);
      if (!pathData.length) return null;
      return {
        ...base,
        type: GraphicsType.Path,
        ...normalizePath(pathData, transform),
      };
    }
    case 'text': {
      const fontSize = numberAttr(attributes, 'font-size') || 16;
      return {
        ...base,
        type: GraphicsType.Text,
        content: node.text ?? '',
        fontSize,
        fontFamily: attributes['font-family'] ?? 'Arial',
        width: numberAttr(attributes, 'width') || 80,
        height: numberAttr(attributes, 'height') || fontSize,
        transform: multiplyTransform(
          transform,
          translate(
            numberAttr(attributes, 'x'),
            numberAttr(attributes, 'y') - fontSize,
          ),
        ),
      } as GraphicsAttrs;
    }
    default:
      return null;
  }
};

const collectLeafGraphics = (
  node: SvgNode,
  parentTransform: Matrix,
  graphics: GraphicsAttrs[],
  parentPaintAttributes: InheritedPaintAttributes = {},
) => {
  const transform = multiplyTransform(parentTransform, node.transform);
  const paintAttributes = inheritPaintAttributes(
    parentPaintAttributes,
    node.attributes,
  );
  if (node.children.length) {
    for (const child of node.children) {
      collectLeafGraphics(child, transform, graphics, paintAttributes);
    }
    return;
  }

  const attrs = toGraphicsAttrs(
    {
      ...node,
      attributes: { ...paintAttributes, ...node.attributes },
    },
    transform,
  );
  if (attrs) graphics.push(attrs);
};

export const svgStrToSuikaData = (content: string): GraphicsAttrs[] => {
  const svgNode = svgToJson(content);
  const graphics: GraphicsAttrs[] = [];

  collectLeafGraphics(svgNode, [1, 0, 0, 1, 0, 0], graphics);

  return graphics;
};
