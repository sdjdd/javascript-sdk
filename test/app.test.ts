import 'should';
import { App } from '../src/core';

describe('App', function () {
  describe('#constructor', function () {
    it('should set correct app info and name', function () {
      const appInfo = {
        appId: 'test-app-id',
        appKey: 'test-app-key',
        serverURL: 'test-server-url',
      };
      const app = new App(appInfo);
      app.info.should.eql(appInfo);
    });
  });

  describe('#_makeBaseRequest', function () {
    const app = new App({
      appId: 'test-app-id',
      appKey: 'test-app-key',
      serverURL: 'test-server-url',
    });

    it('should set correct method and path', function () {
      const method = 'TRACE';
      const path = '/path/to/somewhere';
      const req = app._makeBaseRequest(method, path);
      req.method.should.eql(method);
      req.path.should.eql(path);
    });

    it('should set baseURL to app.info.serverURL', function () {
      const req = app._makeBaseRequest('GET', '/path');
      req.baseURL.should.eql(app.info.serverURL);
    });

    it('should set X-LC-* headers', function () {
      const req = app._makeBaseRequest('GET', '/path');
      req.header['X-LC-Id'].should.eql(app.info.appId);
      req.header['X-LC-Key'].should.eql(app.info.appKey);
    });
  });
});
