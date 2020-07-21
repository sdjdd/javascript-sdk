import EventEmitter from 'eventemitter3';
import { Query } from './Query';
import { PushRouter } from '../PushRouter';
import { App } from '../App';
import { HTTPRequest } from '../utils';
import { APIPath } from '../APIPath';
import { LiveQueryEvent } from '../types';
import { ObjectDecoder } from './ObjectEncoding';
import { Connection } from '../Connection';

interface ISubscribeData {
  id: string;
  query_id: string;
}

export class LiveQuery extends EventEmitter<LiveQueryEvent> {
  private _app: App;
  private _query: Query;
  private _messageIndex = 1;
  private _connection: Connection;
  private _subscribeData: ISubscribeData;

  constructor(query: Query) {
    super();
    this._app = query.app;
    this._query = query;
  }

  private async _onOpen(): Promise<void> {
    const req = new HTTPRequest({
      method: 'POST',
      path: APIPath.subscribe,
      body: {
        query: {
          where: this._query.toString(),
          className: this._query.className,
        },
      },
    });
    const res = await this._app._uluru(req);
    const data = res.body as ISubscribeData;

    const loginMessage = {
      cmd: 'login',
      appId: this._app.info.appId,
      i: this._messageIndex++,
      installationId: data.id,
      service: 1, // 0: push, 1: live query
    };
    this._connection.send(JSON.stringify(loginMessage));

    this._subscribeData = data;
  }

  private _onMessage(data: string): void {
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
      if (msg.query_id !== this._subscribeData.query_id) {
        return;
      }
      const obj = ObjectDecoder.decode(msg.object).setApp(this._app);
      const event = msg.op as LiveQueryEvent;
      const updatedKeys = msg.updatedKeys as string[];
      this.emit(event, obj, updatedKeys);
    });
  }

  async subscribe(): Promise<void> {
    if (this._connection !== undefined) {
      throw new Error('Already subscribed');
    }
    this._connection = null;

    const router = await PushRouter.get(this._query.app);
    router.server = 'wss://cn-n1-core-k8s-cell-12.leancloud.cn'; // TODO: delete this line
    this._connection = this._query.app._connect(router.server);

    if (this._connection.isOpen()) {
      this._onOpen();
    }

    this._connection.on('open', this._onOpen, this);
    this._connection.on('message', this._onMessage, this);
  }

  unsubscribe(): void {
    if (!this._connection) {
      return;
    }
    this._connection.off('open', this._onOpen);
    this._connection.off('message', this._onMessage);
  }
}
