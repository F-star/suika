interface IRGB {
  r: number;
  g: number;
  b: number;
}

interface IRGBA extends IRGB {
  a: number;
}

export function parseRGBAStr({ r, g, b, a }: IRGBA) {
  return `rgba(${r},${g},${b},${a})`;
}

export function parseRGBStr({ r, g, b }: { r: number; g: number; b: number }) {
  return `rgb(${r},${g},${b})`;
}
/**
 * normalize hex to `RRGGBB` string format
 *
 * reference: https://mp.weixin.qq.com/s/RWlsT-5wPTD7-OpMiVhqiA
 */
export const normalizeHex = (hex: string) => {
  hex = hex.toUpperCase();
  const match = hex.match(/[0-9A-F]{1,6}/);
  if (!match) {
    return '';
  }
  hex = match[0];

  if (hex.length === 6) {
    return hex;
  }
  if (hex.length === 4 || hex.length === 5) {
    hex = hex.slice(0, 3);
  }
  // ABC -> AABBCC
  if (hex.length === 3) {
    return hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  // AB => ABABAB
  // A -> AAAAAA
  return hex.padEnd(6, hex);
};

export const parseRGBToHex = (rgb: { r: number; g: number; b: number }) => {
  const { r, g, b } = rgb;
  const hex = (r << 16) | (g << 8) | b;
  return hex.toString(16).toUpperCase().padStart(6, '0');
};

export const parseHexToRGB = (hex: string): IRGB | null => {
  hex = normalizeHex(hex);
  if (!hex) {
    return null;
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
};

export const parseHexToRGBA = (hex: string): IRGBA | null => {
  hex = normalizeHex(hex);
  if (!hex) {
    return null;
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const aStr = hex.slice(6, 8);
  const a = aStr ? parseInt(aStr, 16) / 255 : 1;
  return { r, g, b, a };
};
