import { HocuspocusProvider } from '@hocuspocus/provider';
import { type SuikaEditor } from '@suika/core';
import * as Y from 'yjs';

import { SuikaBinding } from './y-suika';

export const joinRoom = (editor: SuikaEditor, roomId: string) => {
  const provider = new HocuspocusProvider({
    url: 'ws://localhost:5358',
    name: roomId,
  });

  const yMap = provider.document.getMap<Record<string, any>>('nodes');
  new SuikaBinding(yMap, editor);
};
