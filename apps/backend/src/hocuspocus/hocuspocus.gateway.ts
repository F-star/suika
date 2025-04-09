import { Hocuspocus, Server } from '@hocuspocus/server';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import { Logger } from '@hocuspocus/extension-logger';

import WebSocket from 'ws';
import { Database } from '@hocuspocus/extension-database';
import { FilesService } from 'src/files/files.service';
import { JwtService } from '@nestjs/jwt';
import { generateInitialDoc } from 'src/utils';
import { jwtConstants } from 'src/auth/constants';

@WebSocketGateway({ path: 'join/room/' })
export class HocuspocusGateway implements OnGatewayConnection {
  private server: Hocuspocus;

  constructor(
    private readonly filesService: FilesService,
    private jwtService: JwtService,
  ) {
    this.initServer();
  }

  private initServer() {
    this.server = Server.configure({
      name: 'suika-document-server',
      extensions: [
        new Logger(),
        new Database({
          fetch: async (data) => {
            const docId = Number(data.documentName);
            const res = await this.filesService.getContent(docId);
            console.log(`---fetch [${docId}]---`);
            if (res && res.content) {
              return new Uint8Array(res.content);
            }
            return generateInitialDoc();
          },
          store: async (data) => {
            // const { document } = data;
            const docId = Number(data.documentName);
            console.log(`---store [${docId}]---`);
            // console.log(data.document.getMap('nodes').toJSON());
            await this.filesService.updateContent(docId, data.state);
          },
        }),
      ],
      async afterLoadDocument(data) {
        console.log(`---afterLoadDocument [${data.documentName}]---`);
        // console.log(data.document.getMap('nodes').toJSON());
      },
      async onConnect(/*data*/) {
        console.log(`---------------> New websocket connection`);
        // console.log(data);
        // data.context
      },
      onAuthenticate: async (data) => {
        console.log('>------- 验证 token', data.token);
        data.documentName;

        // TODO: check jwt and get user id
        const payload = await this.jwtService.verifyAsync(data.token, {
          secret: jwtConstants.secret,
        });

        const docId = Number(data.documentName);

        await this.filesService.checkExit(docId, payload.id);

        console.log('payload', payload);

        return {
          id: 1145,
        };
      },
    });
  }

  handleConnection(websocket: WebSocket, request: IncomingMessage) {
    const context = {
      id: 'hi-9987',
    };
    this.server.handleConnection(websocket, request, context);
  }
}
