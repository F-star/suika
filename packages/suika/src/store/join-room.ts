import { HocuspocusProvider } from '@hocuspocus/provider';
import { type SuikaEditor } from '@suika/core';

import { SuikaBinding } from './y-suika';

export const joinRoom = (editor: SuikaEditor, roomId: string) => {
  const provider = new HocuspocusProvider({
    url: 'ws://localhost:5356/join/room/',
    name: roomId,
    // token: '',
    // onAuthenticationFailed: (data) => {
    //   console.log('权限不足', data);
    // },
  });

  const yMap = provider.document.getMap<Record<string, any>>('nodes');
  new SuikaBinding(yMap, editor);
  return {
    provider,
  };
};
