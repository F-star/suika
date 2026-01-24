import { HocuspocusProvider } from '@hocuspocus/provider';
import { type SuikaEditor } from '@suika/core';

import { SuikaBinding } from './y-suika';

export const joinRoom = (
  editor: SuikaEditor,
  roomId: string,
  user: { username: string; id: string },
) => {
  const host = import.meta.env.DEV ? 'localhost:5356' : location.host;

  // 读取 cookies 的 access_token
  const accessToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('access_token='))
    ?.split('=')[1];

  const provider = new HocuspocusProvider({
    url: `ws://${host}/join/room/`,
    name: roomId + '',
    token: accessToken,
    onAuthenticationFailed: (data) => {
      console.log('authentication failed', data);
      // TODO: jump to login page
      if (!import.meta.env.DEV) {
        location.href = '/login';
      }
    },
  });

  const yMap = provider.document.getMap<Record<string, any>>('nodes');
  return new SuikaBinding(yMap, editor, provider.awareness!, user);
};
