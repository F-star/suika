
export interface IGraph {
  x: number;
  y: number;
  // 颜色
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // transform 相关
  rotation?: number;
}


export class Graph {
  x: number;
  y: number;
  // 颜色
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // transform 相关
  rotation?: number;
  constructor(options: IGraph) {
    this.x = options.x;
    this.y = options.y;
    if (options.fill) {
      this.fill = options.fill;
    }
    if (options.stroke) {
      this.stroke = options.stroke;
    }
    if (options.rotation) {
      this.rotation = options.rotation;
    }

  }
  setAttrs(attrs: Partial<IGraph>) {
    let key: keyof Partial<IGraph>;
    for (key in attrs) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self: any = this;
      self[key] = attrs[key];
    }
  }
  getAttrs(attrKeys: Array<keyof IGraph>) {
    const attrs: Partial<IGraph> = {};
    for (let i = 0, len = attrKeys.length; i < len; i++) {
      const key = attrKeys[i];
      (attrs as any)[key] = this[key];
    }
    return attrs;
  }
}

export const getFill = (obj: Pick<IGraph, 'fill'>) => {
  return obj.fill || '';
};