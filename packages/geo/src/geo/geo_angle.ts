const DOUBLE_PI = Math.PI * 2;

export function rad2Deg(radian: number) {
  return (radian * 180) / Math.PI;
}

export function deg2Rad(degree: number) {
  return (degree * Math.PI) / 180;
}

/**
 * normalize radian, make it in [0, Math.PI * 2)
 */
export const normalizeRadian = (radian: number): number => {
  radian = radian % DOUBLE_PI;
  if (radian < 0) {
    radian += DOUBLE_PI;
  }
  return radian;
};

/**
 * normalize degree, make it in [0, 360)
 */
export const normalizeDegree = (degree: number): number => {
  degree = degree % 360;
  if (degree < 0) {
    degree += 360;
  }
  return degree;
};
