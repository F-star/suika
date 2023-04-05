import { Graph } from './scene/graph';

/**
 * 对图形的操作，本质是增删改
 * 所以我们其实可以统一用 updateSet、removedSet 来定义一个操作
 */
export class Transaction {
  private updatedSet = new Set<Graph>();
  private destroyedSet = new Set<Graph>();
  updateItems() {
    //
  }
  destroyItems() {
    //
  }
  // commit(msg: string) {
  //   // 更新 Graph 树
  //   //
  // }
}