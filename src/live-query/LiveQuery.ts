import { Realtime, setAdapters } from 'leancloud-realtime/core';
import { LiveQueryPlugin } from 'leancloud-realtime-plugin-live-query';
import { EventEmitter } from 'eventemitter3';
import { LiveQueryEvent, IApp, IQuery } from '../types';
import { IHTTPRequest, Adapters } from '../Adapters';
import { PATH_SUBSCRIBE, PATH_UNSUBSCRIBE } from '../api-path';
import { send } from '../http';
import { Cache } from '../Cache';
import { ObjectDecoder } from '../storage/ObjectEncoding';
import { log } from '../utils';

Adapters.onSet(setAdapters);

interface ISubscribeData {
  id: string;
  query_id: string;
}

class RealtimeManager {
  private static readonly cacheKey = 'REALTIME_INSTANCE';

  static get(app: IApp): any {
    let realtime = Cache.get(app, RealtimeManager.cacheKey);
    if (!realtime) {
      realtime = new Realtime({
        appId: app.appId,
        appKey: app.appKey,
        server: app.serverURL,
        plugins: [LiveQueryPlugin],
      });
      Cache.set(app, RealtimeManager.cacheKey, realtime);
    }
    return realtime;
  }

  static pause(app: IApp): void {
    RealtimeManager.get(app).pause();
  }

  static resume(app: IApp): void {
    RealtimeManager.get(app).resume();
  }
}

class LiveQueryClientFactory {
  static create(app: IApp, subscriptionId: string): Promise<any> {
    return RealtimeManager.get(app).createLiveQueryClient(subscriptionId);
  }
}

export class LiveQuery extends EventEmitter<LiveQueryEvent> {
  private _app: IApp;
  private _query: IQuery;
  private _client: any;
  private _id: string;
  private _queryId: string;
  private _subReq: IHTTPRequest;
  private _onMessageHandler = this._onMessage.bind(this);
  private _onReconnectHandler = this._onReconnect.bind(this);

  constructor(query: IQuery) {
    super();
    this._app = query.app;
    this._query = query;
  }

  async _subscribe(): Promise<this> {
    this._subReq = {
      method: 'POST',
      path: PATH_SUBSCRIBE,
      body: {
        query: {
          where: this._query.toString(),
          className: this._query.className,
        },
      },
    };
    const res = await send(this._subReq).to(this._app);

    const { id, query_id } = res.body as ISubscribeData;
    this._id = id;
    this._queryId = query_id;
    this._subReq.body.id = id;
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
    send(this._subReq)
      .to(this._app)
      .then(() => log('LC:LiveQuery:reconnect', 'ok'))
      .catch((err) => {
        log('LC:LiveQuery:reconnect', 'failed: %o', err);
        throw new Error('LiveQuery resubscribe error: ' + err.message);
      });
  }

  async unsubscribe(): Promise<void> {
    this._client.off('message', this._onMessageHandler);
    this._client.off('reconnect', this._onReconnectHandler);
    this._client.close();
    send({
      method: 'POST',
      path: PATH_UNSUBSCRIBE,
      body: { id: this._id, query_id: this._queryId },
    }).to(this._app);
  }
}

export function subscribe(query: IQuery): Promise<LiveQuery> {
  return new LiveQuery(query)._subscribe();
}

export function pause(app: IApp): void {
  RealtimeManager.pause(app);
}

export function resume(app: IApp): void {
  RealtimeManager.resume(app);
}
