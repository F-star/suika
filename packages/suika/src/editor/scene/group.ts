// import { IRect } from '../../type';
// import { arrMap } from '../../utils/array_util';
// import { ImgManager } from '../Img_manager';
// import { Graph, GraphAttrs } from './graph';

// export interface GroupAttrs
//   extends Omit<GraphAttrs, 'x' | 'y' | 'width' | 'height'> {
//   children?: Graph[];
// }

// /**
//  * Group
//  *
//  * 子图形的属性，保存的是应用 Group 后的值，还是 Group 之前的值呢？
//  * 多层 Group 嵌套如何处理？
//  *
//  * 数据层应该是应用前的值，但在 UI 表现上，需要是应用 Group 之后的值。
//  *
//  * Group 的 x、y、width、height 是基于子图形的 BBox 计算出来的。是不是要缓存一下
//  *
//  * 拍平？
//  */
// export class Group2333 extends Graph {
//   children: Graph[];

//   constructor(options?: GroupAttrs) {
//     options = options || {};
//     super({
//       // type: GraphType.Group,
//       x: 0,
//       y: 0,
//       width: 0,
//       height: 0,
//       ...options,
//     });
//     this.children = options.children ?? [];
//   }

//   // TODO: 不要重复调用 getBBoxWithoutRotation，应该缓存一下
//   get x(): number {
//     return this.getRect().x;
//   }

//   set x(val: number) {
//     const dx = val - this.x;
//     for (const child of this.children) {
//       child.x += dx;
//     }
//   }

//   get y(): number {
//     return this.getRect().y;
//   }

//   set y(val: number) {
//     const dy = val - this.y;
//     for (const child of this.children) {
//       child.y += dy;
//     }
//   }

//   /**
//    * TODO: 应该旋转前的 bbox，但还没实现，先返回一个旋转过的
//    */
//   getRect(): IRect {
//     return this.getBBox();
//   }

//   getBBox(): IRect {
//     const { children } = this;

//     if (children.length === 0) {
//       return {
//         x: 0,
//         y: 0,
//         width: 0,
//         height: 0,
//       };
//     }

//     let minX = Infinity;
//     let minY = Infinity;
//     let maxX = -Infinity;
//     let maxY = -Infinity;

//     for (const child of children) {
//       const { x, y, width, height } = child.getBBox();
//       minX = Math.min(minX, x);
//       minY = Math.min(minY, y);
//       maxX = Math.max(maxX, x + width);
//       maxY = Math.max(maxY, y + height);
//     }

//     return {
//       x: minX,
//       y: minY,
//       width: maxX - minX,
//       height: maxY - minY,
//     };
//   }

//   draw(ctx: CanvasRenderingContext2D, imgManager: ImgManager, smooth: boolean) {
//     for (const child of this.children) {
//       ctx.save();
//       child.draw(ctx, imgManager, smooth);
//       ctx.restore();
//     }
//   }

//   hitTest(x: number, y: number, padding = 0) {
//     for (const child of this.children) {
//       if (child.hitTest(x, y, padding)) {
//         return true;
//       }
//     }
//     return false;
//   }

//   intersectWithRect(rect: IRect): boolean {
//     for (const child of this.children) {
//       if (child.intersectWithRect(rect)) {
//         return true;
//       }
//     }
//     return false;
//   }

//   toJSON() {
//     return {
//       type: this.type,
//       id: this.id,
//       objectName: this.objectName,
//       x: this.x,
//       y: this.y,
//       width: this.width,
//       height: this.height,
//       fill: this.fill,
//       stroke: this.stroke,
//       strokeWidth: this.strokeWidth,
//       rotation: this.rotation,
//       children: arrMap(this.children, (child) => child.toJSON()),
//     };
//   }

//   toObjects() {
//     return {
//       type: this.type,
//       id: this.id,
//       name: this.objectName,
//       children: arrMap(this.children, (child) => child.toObjects()),
//     };
//   }
// }
export {};
