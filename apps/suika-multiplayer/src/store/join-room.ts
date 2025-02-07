import { HocuspocusProvider } from '@hocuspocus/provider';
import { type SuikaEditor } from '@suika/core';

import { SuikaBinding } from './y-suika';

export const joinRoom = (
  editor: SuikaEditor,
  roomId: string,
  user: { username: string; id: number },
) => {
  const host = import.meta.env.DEV ? 'localhost:5356' : location.host;

  const provider = new HocuspocusProvider({
    url: `ws://${host}/join/room/`,
    name: roomId,
    token: document.cookie.slice(13),
    onAuthenticationFailed: (data) => {
      console.log('权限不足', data);
    },
  });

  const yMap = provider.document.getMap<Record<string, any>>('nodes');
  return new SuikaBinding(yMap, editor, provider.awareness!, user);
};
