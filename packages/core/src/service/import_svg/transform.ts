import type { Matrix } from './types';

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

// m1 * m2（先应用 m2 再 m1 的组合等价于 SVG 从左到右的语义相乘）
function multiply(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

function funcToMatrix(name: string, args: number[]): Matrix {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  switch (name) {
    case 'matrix':
      return [
        args[0] ?? 1,
        args[1] ?? 0,
        args[2] ?? 0,
        args[3] ?? 1,
        args[4] ?? 0,
        args[5] ?? 0,
      ];
    case 'translate':
      return [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0];
    case 'scale': {
      const sx = args[0] ?? 1;
      const sy = args[1] ?? sx;
      return [sx, 0, 0, sy, 0, 0];
    }
    case 'rotate': {
      const a = rad(args[0] ?? 0);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const rotation: Matrix = [cos, sin, -sin, cos, 0, 0];
      if (args.length >= 3) {
        const cx = args[1];
        const cy = args[2];
        // translate(cx,cy) * rotate * translate(-cx,-cy)
        return multiply(multiply([1, 0, 0, 1, cx, cy], rotation), [
          1,
          0,
          0,
          1,
          -cx,
          -cy,
        ]);
      }
      return rotation;
    }
    case 'skewX':
      return [1, 0, Math.tan(rad(args[0] ?? 0)), 1, 0, 0];
    case 'skewY':
      return [1, Math.tan(rad(args[0] ?? 0)), 0, 1, 0, 0];
    default:
      return [...IDENTITY];
  }
}

export function parseTransform(input: string | null): Matrix {
  if (!input || !input.trim()) return [...IDENTITY];
  let result: Matrix = [...IDENTITY];
  const re = /(\w+)\s*\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const name = m[1];
    const args = m[2]
      .split(/[\s,]+/)
      .filter((s) => s.length > 0)
      .map(Number);
    result = multiply(result, funcToMatrix(name, args));
  }
  return result;
}
