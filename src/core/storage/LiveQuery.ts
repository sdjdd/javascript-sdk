import EventEmitter from 'eventemitter3';
import { Query } from './Query';
import { App } from '../App';
import { HTTPRequest } from '../utils';
import { APIPath } from '../APIPath';
import { LiveQueryEvent } from '../types';
import { ObjectDecoder } from './ObjectEncoding';
import { IMConnection } from '../realtime/IMConnection';

interface ISubscribeData {
  id: string;
  query_id: string;
}

export class LiveQuery extends EventEmitter<LiveQueryEvent> {
  private _app: App;
  private _query: Query;
  private _connection: IMConnection;
  private _subscribeData: ISubscribeData;
  private _onOpenHandler: () => void;
  private _onMessageHandler: (data: string) => void;

  constructor(query: Query) {
    super();
    this._app = query.app;
    this._query = query;
    this._connection = this._query.app._getConnection();

    if (this._connection.isOpen()) {
      this._onOpen();
    }

    this._onOpenHandler = this._onOpen.bind(this);
    this._onMessageHandler = this._onMessage.bind(this);
    this._connection.on('open', this._onOpenHandler);
    this._connection.on('message', this._onMessageHandler);
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
      i: this._connection.nextIndex,
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

  unsubscribe(): void {
    this._connection.off('open', this._onOpenHandler);
    this._connection.off('message', this._onMessageHandler);
    const logoutMessage = {
      cmd: 'logout',
      appId: this._app.info.appId,
      i: this._connection.nextIndex,
      installationId: this._subscribeData.id,
      service: 1,
    };
    this._connection.send(JSON.stringify(logoutMessage));
  }
}
