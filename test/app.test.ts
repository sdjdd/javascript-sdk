import 'should';
import { App } from '../src/core';
import { setGlobalTestPlatform } from './TestPlatform';

setGlobalTestPlatform();

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
});
