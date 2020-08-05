import { EventEmitter } from 'eventemitter3';
import { Query } from './Query';
import { App } from '../App';
import { APIPath } from '../APIPath';
import { LiveQueryEvent } from '../types';
import { ObjectDecoder } from './ObjectEncoding';
import { Realtime, setAdapters } from 'leancloud-realtime/core';
import { LiveQueryPlugin } from 'leancloud-realtime-plugin-live-query';
import { IHTTPRequest, Adapters } from '../Adapters';

Adapters.onSet(setAdapters);

interface ISubscribeData {
  id: string;
  query_id: string;
}

class RealtimeManager {
  private static readonly cacheSymbol = Symbol('realtime instance');

  static get(app: App): any {
    let realtime = app._cacheGet(RealtimeManager.cacheSymbol);
    if (!realtime) {
      realtime = new Realtime({
        appId: app.info.appId,
        appKey: app.info.appKey,
        server: app.info.serverURL,
        plugins: [LiveQueryPlugin],
      });
      app._cacheSet(RealtimeManager.cacheSymbol, realtime);
    }
    return realtime;
  }

  static pause(app: App): void {
    RealtimeManager.get(app).pause();
  }

  static resume(app: App): void {
    RealtimeManager.get(app).resume();
  }
}

class LiveQueryClientFactory {
  static create(app: App, subscriptionId: string): Promise<any> {
    return RealtimeManager.get(app).createLiveQueryClient(subscriptionId);
  }
}

export class LiveQuery extends EventEmitter<LiveQueryEvent> {
  private _app: App;
  private _query: Query;
  private _client: any;
  private _id: string;
  private _queryId: string;
  private _onMessageHandler = this._onMessage.bind(this);
  private _onReconnectHandler = this._onReconnect.bind(this);
  private _subscribeRequest: IHTTPRequest;

  constructor(query: Query) {
    super();
    this._app = query.app;
    this._query = query;
  }

  static subscribe(query: Query): Promise<LiveQuery> {
    return new LiveQuery(query).subscribe();
  }

  static pause(app: App): void {
    RealtimeManager.pause(app);
  }

  static resume(app: App): void {
    RealtimeManager.resume(app);
  }

  async subscribe(): Promise<this> {
    this._subscribeRequest = {
      method: 'POST',
      path: APIPath.subscribe,
      body: {
        query: {
          where: this._query.toString(),
          className: this._query.className,
        },
      },
    };
    const res = await this._app._uluru(this._subscribeRequest);

    const { id, query_id } = res.body as ISubscribeData;
    this._id = id;
    this._queryId = query_id;
    this._subscribeRequest.body.id = id;
    this._client = await LiveQueryClientFactory.create(this._app, id);

    this._client.on('message', this._onMessageHandler);
    this._client.on('reconnect', this._onReconnectHandler);
    return this;
  }

  private _onMessage(messages: Record<string, unknown>[]): void {
    messages.forEach((msg) => {
      if (msg.query_id !== this._queryId) return;
      const obj = ObjectDecoder.decode(msg.object).setApp(this._app);
      const event = msg.op as LiveQueryEvent;
      const updatedKeys = msg.updatedKeys as string[];
      this.emit(event, obj, updatedKeys);
    });
  }

  private _onReconnect(): void {
    this._app._uluru(this._subscribeRequest).catch((err) => {
      throw new Error('LiveQuery resubscribe error: ' + err.message);
    });
  }

  async unsubscribe(): Promise<void> {
    this._client.off('message', this._onMessageHandler);
    this._client.off('reconnect', this._onReconnectHandler);
    this._client.close();
    await this._app._uluru({
      method: 'POST',
      path: APIPath.unsubscribe,
      body: { id: this._id, query_id: this._queryId },
    });
  }
}
