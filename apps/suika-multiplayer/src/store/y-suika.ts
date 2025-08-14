import { type HocuspocusProvider } from '@hocuspocus/provider';
import { EventEmitter, isEqual, pick, throttle } from '@suika/common';
import {
  type GraphicsAttrs,
  GraphicsType,
  type IChanges,
  type SuikaEditor,
} from '@suika/core';
import { type IPoint } from '@suika/geo';
import type * as Y from 'yjs';
import { type YMap, type YMapEvent } from 'yjs/dist/src/internals';

import { type IUserItem } from '../type';

const devLog = (...data: any[]) => {
  // console.log(...data);
};

interface Events {
  usersChange(items: IUserItem[]): void;
}

export class SuikaBinding {
  private doc: Y.Doc;
  private dataInitialed = false;

  private eventEmitter = new EventEmitter<Events>();

  constructor(
    private yMap: YMap<Record<string, any>>,
    private editor: SuikaEditor,
    public awareness: NonNullable<HocuspocusProvider['awareness']>,
    private user: { username: string; id: number },
  ) {
    this.doc = yMap.doc!;
    // data
    editor.doc.on('sceneChange', this.suikaObserve);
    yMap.observe(this.yMapObserve);

    // awareness
    this.awareness.on('change', this.onAwarenessChange);
    this.editor.mouseEventManager.on('cursorPosUpdate', this.onCursorPosChange);
    this.awareness.setLocalStateField('user', {
      id: this.user.id,
      name: this.user.username,
      awarenessId: this.awareness.clientID,
      pos: null,
      color: getRandomColor(),
    });
  }

  // editor --> remote
  private suikaObserve = (ops: IChanges) => {
    const yMap = this.yMap;
    devLog('[[editor --> remote]]');
    devLog(ops);

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
  };

  // remote --> editor
  private yMapObserve = (event: YMapEvent<any>) => {
    const yMap = this.yMap;
    if (event.transaction.origin == this) {
      return;
    }
    devLog('[[remote --> editor]]');
    devLog('------ y.js event.changes ------');
    devLog(event.changes);
    const changes: IChanges = {
      added: new Map(),
      deleted: new Set(),
      update: new Map(),
    };
    for (const [id, { action }] of event.changes.keys) {
      if (action === 'delete') {
        changes.deleted.add(id);
        return;
      }
      const attrs = yMap.get(id) as GraphicsAttrs;
      if (action === 'add' && attrs.type !== GraphicsType.Document) {
        changes.added.set(id, attrs);
      } else if (action === 'update') {
        changes.update.set(id, attrs);
      }
    }

    devLog('------ parse to suika changes ------');
    devLog(changes);

    this.editor.applyChanges(changes);
    if (!this.dataInitialed) {
      this.editor.viewportManager.zoomToFit(1);
    }
    this.dataInitialed = true;
    this.editor.render();
  };

  private onAwarenessChange = () => {
    const users = Array.from(this.awareness.getStates().values())
      .filter((item) => item.user)
      .map((item) => item.user) as IUserItem[];
    this.eventEmitter.emit('usersChange', users);
  };

  private onCursorPosChange = throttle((pos: IPoint) => {
    const activeClientCount = this.awareness.getStates().size;
    if (activeClientCount < 2) return;

    const localState = this.awareness.getLocalState()!;
    this.awareness.setLocalStateField('user', {
      ...localState.user,
      pos: { ...pos },
    });
  }, 80);

  destroy() {
    // data
    this.yMap.unobserve(this.yMapObserve);
    this.editor.doc.off('sceneChange', this.suikaObserve);

    // awareness
    this.editor.mouseEventManager.off(
      'cursorPosUpdate',
      this.onCursorPosChange,
    );
    this.awareness.off('change', this.onAwarenessChange);
    this.awareness.destroy();
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }

  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
}

const getRandomColor = () => {
  const randNum = getRandom(0, colors.length - 1);
  return colors[randNum];
};

const colors = [
  '#0C83AC',
  '#14B531',
  '#FFBC42',
  '#EE6352',
  '#26A0B3',
  '#3B9C37',
  '#0794A5',
  '#FFCD29',
  '#FF0044',
  '#9747FF',
  '#FF24BD',
  '#14AE5C',
];

const getRandom = (min: number, max: number) => {
  if (min > max) {
    [min, max] = [max, min];
  }
  min = Math.floor(min);
  max = Math.ceil(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};
