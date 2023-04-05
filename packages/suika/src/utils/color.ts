interface IRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}
export function parseRGBAStr({ r, g, b, a }: IRGBA) {
  return `rgba(${r},${g},${b},${a})`;
}

export function parseRGBStr({ r, g, b }: { r: number; g: number; b: number }) {
  return `rgb(${r},${g},${b})`;
}
/**
 * normalize hex to #RRGGBBAA（upperCase with "#"）
 */
export const normalizeHex = (hex: string) => {
  // TODO: work in process
  if (hex[0] === '#') {
    hex = hex.slice(1);
  }
  hex = hex.toUpperCase();
  const n = hex.length;
  if (n === 3) {
    hex = hex + 'F'; // append transparent value
  }
  if (n === 6) {
    hex = hex + 'FF';
  }
};


export const parseRGBToHex = (rgb: {r: number, g: number, b: number}) => {
  const { r, g, b } = rgb;
  const hex = (r << 16) | (g << 8) | b;
  return '#' + hex.toString(16).toUpperCase().padStart(6, '0');
};
