import { isEqual, pick } from '@suika/common';
import { type Editor, type GraphicsAttrs, type IChanges } from '@suika/core';
import type * as Y from 'yjs';
import { type YMap, type YMapEvent } from 'yjs/dist/src/internals';

export class SuikaBinding {
  private doc: Y.Doc;
  private dataInitialed = false;

  constructor(private yMap: YMap<Record<string, any>>, private suika: Editor) {
    this.doc = yMap.doc!;
    suika.doc.on('sceneChange', this.suikaObserve);
    yMap.observe(this.yMapObserve);
  }

  // editor --> remote
  private suikaObserve = (ops: IChanges) => {
    const yMap = this.yMap;
    this.doc.transact(() => {
      for (const [id, attrs] of ops.added) {
        yMap.set(id, attrs);
      }
      for (const id of ops.deleted) {
        yMap.delete(id);
      }
      for (const [id, attrs] of ops.update) {
        const oldAttrs = yMap.get(id);
        const keys = Object.keys(attrs);
        if (!isEqual(pick(oldAttrs, keys), attrs)) {
          yMap.set(id, { ...yMap.get(id), ...attrs });
        }
      }
    }, this);
    console.log('editor --> remote', ops);
  };

  // remote --> editor
  private yMapObserve = (event: YMapEvent<any>) => {
    const yMap = this.yMap;
    if (event.transaction.origin == this) {
      return;
    }
    console.log('remote --> editor');
    console.log('------ y.js event.changes ------');
    console.log(event.changes);
    const changes: IChanges = {
      added: new Map(),
      deleted: new Set(),
      update: new Map(),
    };
    for (const [id, { action }] of event.changes.keys) {
      if (action === 'add') {
        const attrs = yMap.get(id);
        changes.added.set(id, attrs as GraphicsAttrs);
      } else if (action === 'update') {
        changes.update.set(id, yMap.get(id) as GraphicsAttrs);
      } else if (action === 'delete') {
        changes.deleted.add(id);
      }
    }

    console.log('------ parse to suika changes ------');
    console.log(changes);

    this.suika.applyChanges(changes);
    if (!this.dataInitialed) {
      this.suika.zoomManager.zoomToFit(1);
    }
    this.dataInitialed = true;
    this.suika.render();
  };

  destroy() {
    this.yMap.unobserve(this.yMapObserve);
    this.suika.doc.off('sceneChange', this.suikaObserve);
  }
}
