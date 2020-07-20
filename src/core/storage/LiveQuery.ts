import { Query } from './Query';
import { PushRouter } from '../PushRouter';
import { App } from '../App';
import { HTTPRequest } from '../utils';
import { APIPath } from '../APIPath';
import { LiveQueryEvent, LiveQueryHandler } from '../types';
import { ObjectDecoder } from './ObjectEncoding';
import { Connection } from '../Connection';

interface ISubscribeData {
  id: string;
  query_id: string;
}

export class LiveQuery {
  app: App;
  messageIndex = 1;

  private handlers = new Map<LiveQueryEvent, LiveQueryHandler[]>();
  private connection: Connection;
  private onOpen: () => void;
  private onMessage: (data: string) => void;

  constructor(public query: Query) {
    this.app = query.app;
  }

  private async listen(): Promise<ISubscribeData> {
    const req = new HTTPRequest({
      method: 'POST',
      path: APIPath.subscribe,
      body: {
        query: {
          where: this.query.toString(),
          className: this.query.className,
        },
      },
    });
    const res = await this.app._uluru(req);
    const data = res.body as ISubscribeData;

    const loginMessage = {
      cmd: 'login',
      appId: this.app.info.appId,
      i: this.messageIndex++,
      installationId: data.id,
      service: 1, // 0: push, 1: live query
    };
    this.connection.send(JSON.stringify(loginMessage));
    return data;
  }

  async subscribe(): Promise<void> {
    if (this.connection !== undefined) {
      throw new Error('Already subscribed');
    }
    this.connection = null;

    const router = await PushRouter.get(this.query.app);
    router.server = 'wss://cn-n1-core-k8s-cell-12.leancloud111.cn';
    this.connection = this.query.app._connect(router.server);

    let subscribeData: ISubscribeData;
    this.onOpen = async () => {
      subscribeData = await this.listen();
    };
    this.onMessage = (data) => {
      if (typeof data !== 'string') {
        return;
      }
      const parsed = JSON.parse(data);
      if (parsed.cmd !== 'data') {
        return;
      }

      // const ack = JSON.stringify({
      //   cmd: 'ack',
      //   appId: this.app.info.appId,
      //   installationId: subscribeData.id,
      //   service: 1,
      //   ids: parsed.ids,
      // });
      // this.connection.send(ack);

      const msgs = parsed.msg as Record<string, unknown>[];
      msgs.forEach((msg) => {
        if (msg.query_id !== subscribeData.query_id) {
          return;
        }
        const handlers = this.handlers.get(msg.op as LiveQueryEvent);
        if (handlers) {
          handlers.forEach((handler) => {
            const obj = ObjectDecoder.decode(msg.object).setApp(this.app);
            handler(obj, msg.updatedKeys as string[]);
          });
        }
      });
    };

    if (this.connection.isOpen()) {
      this.onOpen();
    }

    this.connection.on('open', this.onOpen);
    this.connection.on('message', this.onMessage);
  }

  unsubscribe(): void {
    if (this.connection) {
      if (this.onOpen) {
        this.connection.off('open', this.onOpen);
      }
      if (this.onMessage) {
        this.connection.off('message', this.onMessage);
      }
    }
  }

  on(event: LiveQueryEvent, handler: LiveQueryHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }
}
