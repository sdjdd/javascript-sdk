import { App, KEY_PUSH_ROUTER } from './App';
import { IPushRouterData } from './types';
import { HTTPRequest } from './utils';

export class PushRouter {
  static async get(app: App): Promise<IPushRouterData> {
    const routerStr = app._kvGet(KEY_PUSH_ROUTER);
    if (routerStr) {
      const router = JSON.parse(routerStr) as IPushRouterData;
      if (router.expireAt && Date.now() < router.expireAt) {
        return Promise.resolve(router);
      }
    }

    const req = new HTTPRequest({
      method: 'GET',
      path: '/v1/route',
      query: {
        appId: app.info.appId,
        secure: 'true',
      },
    });
    const res = await app._uluru(req);

    const router = res.body as IPushRouterData;
    router.expireAt = Date.now() + router.ttl * 1000;
    app._kvSet(KEY_PUSH_ROUTER, JSON.stringify(router));
    return router;
  }
}
