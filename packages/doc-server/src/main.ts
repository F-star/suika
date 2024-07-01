import { Logger } from '@hocuspocus/extension-logger';
import { Server } from '@hocuspocus/server';

const server = Server.configure({
  port: 5678,
  address: '127.0.0.1',
  name: 'hocuspocus-document-server',
  extensions: [new Logger()],
});

server.listen();
