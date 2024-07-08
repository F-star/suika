import { type SuikaEditor } from '@suika/core';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { SuikaBinding } from './y-suika';

export const joinRoom = (editor: SuikaEditor) => {
  const yDoc = new Y.Doc();
  const yMap = yDoc.getMap<Record<string, any>>('suika-3456');
  new WebsocketProvider('ws://localhost:8912', 'suika-demo-room', yDoc);
  new SuikaBinding(yMap, editor);
};
