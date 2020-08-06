import { KEY_PUSH_ROUTER, Cache } from '../Cache';
import { IPushRouterData, IApp } from '../types';
import { send } from '../http';

export class PushRouter {
  static async get(app: IApp, useCache = true): Promise<IPushRouterData> {
    if (useCache) {
      const cache = PushRouter.getFromCache(app);
      if (cache) {
        return cache;
      }
    }

    const res = await send({
      method: 'GET',
      path: '/v1/route',
      query: {
        appId: app.appId,
        secure: 'true',
      },
    }).to(app);

    const router = res.body as IPushRouterData;
    router.expireAt = Date.now() + router.ttl * 1000;
    Cache.set(app, KEY_PUSH_ROUTER, JSON.stringify(router), true);
    return router;
  }

  static getFromCache(app: IApp): IPushRouterData {
    const routerStr = Cache.get(app, KEY_PUSH_ROUTER, true) as string;
    if (routerStr) {
      const router = JSON.parse(routerStr) as IPushRouterData;
      if (router.expireAt && Date.now() < router.expireAt) {
        return router;
      }
    }
    return null;
  }
}
