import { v4 as uuidv4 } from 'uuid';

export const noop = () => {
  // do nothing
};

/**
 * 生成唯一 ID
 */
export const genUuid = () => {
  return uuidv4();
};

export const increaseIdGenerator = () => {
  let count = 0;
  return () => {
    const id = String(count);
    count++;
    return id;
  };
};

export const objectNameGenerator = {
  maxIdxMap: new Map<string, number>(),
  gen(type: string) {
    let idx = this.maxIdxMap.get(type) ?? 0;
    idx++;
    this.maxIdxMap.set(type, idx);
    return `${type} ${idx}`;
  },
  setMaxIdx(objectName: string) {
    const match = objectName.match(/^(.*)\s+(\d+)$/);
    if (match) {
      const [, type, idxStr] = match;
      const idx = Number(idxStr);
      this.maxIdxMap.set(type, Math.max(this.maxIdxMap.get(type) ?? 0, idx));
    }
  },
};

/**
 * 找出离 value 最近的 segment 的倍数值
 */
export const getClosestTimesVal = (value: number, segment: number) => {
  const n = Math.floor(value / segment);
  const left = segment * n;
  const right = segment * (n + 1);
  return value - left <= right - value ? left : right;
};

export const viewportCoordsToSceneUtil = (
  x: number,
  y: number,
  zoom: number,
  scrollX: number,
  scrollY: number,
  /**
   * 是否四舍五入取整
   */
  round = false,
) => {
  let newX = scrollX + x / zoom;
  let newY = scrollY + y / zoom;
  if (round) {
    newX = Math.round(newX);
    newY = Math.round(newY);
  }
  return {
    x: newX,
    y: newY,
  };
};

export const sceneCoordsToViewportUtil = (
  x: number,
  y: number,
  zoom: number,
  scrollX: number,
  scrollY: number,
) => {
  return {
    x: (x - scrollX) * zoom,
    y: (y - scrollY) * zoom,
  };
};

/**
 * Canvas 中绘制，必须为 x.5 才能绘制一列单独像素，
 * 否则会因为抗锯齿，绘制两列像素，且一个为半透明，导致一种模糊的效果
 *
 * 这个方法会得到值最接近的 x.5 值。
 */
export const nearestPixelVal = (n: number) => {
  const left = Math.floor(n);
  const right = Math.ceil(n);
  return (n - left < right - n ? left : right) + 0.5;
};

/**
 * 两个数组是否 “相同”，当作集合一样来对比，元素相同即可。
 * （数组中不会出现相同元素）
 */

export const isSameArray = (a1: unknown[], a2: unknown[]) => {
  if (a1.length !== a2.length) return false;
  const map = new Map<unknown, true>();
  for (let i = 0, len = a1.length; i < len; i++) {
    map.set(a1[i], true);
  }
  for (let i = 0, len = a2.length; i < len; i++) {
    if (!map.get(a2[i])) {
      return false;
    }
  }
  return true;
};

/**
 * 保留两位小数
 * 如果是 0，丢弃 0
 */
export const remainDecimal = (num: number, precision = 2) => {
  return Number(num.toFixed(precision));
};

/**
 * 字符串转换为数字，并保留两位小数
 */
export const parseToNumber = (str: string, precision = 2) => {
  if (!str) return NaN;
  const num = Number(str);
  if (Number.isNaN(num)) {
    return NaN;
  }
  return remainDecimal(num, precision);
};

/**
 * compare two arrays
 */
export const shallowCompareArrays = (a1: unknown[], a2: unknown[]) => {
  if (a1.length !== a2.length) {
    return false;
  }
  for (let i = 0, len = a1.length; i < len; i++) {
    if (a1[i] !== a2[i]) return false;
  }
  return true;
};

export const getDevicePixelRatio = () => {
  return window.devicePixelRatio || 1;
};

export const calcCoverScale = (
  w: number,
  h: number,
  cw: number,
  ch: number,
): number => {
  if (w === 0 || h === 0) return 1;
  const scaleW = cw / w;
  const scaleH = ch / h;
  const scale = Math.max(scaleW, scaleH);
  return scale;
};

// find the closest value in sorted Array
// (Thanks for Github copilot)
export const getClosestValInSortedArr = (
  sortedArr: number[],
  target: number,
) => {
  if (sortedArr.length === 0) {
    throw new Error('sortedArr can not be empty');
  }
  if (sortedArr.length === 1) {
    return sortedArr[0];
  }

  let left = 0;
  let right = sortedArr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (sortedArr[mid] === target) {
      return sortedArr[mid];
    } else if (sortedArr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // check if left or right is out of bound
  if (left >= sortedArr.length) {
    return sortedArr[right];
  }
  if (right < 0) {
    return sortedArr[left];
  }

  // check which one is closer
  return Math.abs(sortedArr[right] - target) <=
    Math.abs(sortedArr[left] - target)
    ? sortedArr[right]
    : sortedArr[left];
};

export const isWindows =
  navigator.platform.toLowerCase().includes('win') ||
  navigator.userAgent.includes('Windows');

export const escapeHtml = (str: string) => {
  if (typeof str == 'string') {
    return str.replace(/<|&|>/g, (matches) => {
      return {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
      }[matches]!;
    });
  }
  return '';
};
