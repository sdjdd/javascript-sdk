import 'should';
import {
  setGlobalTestPlatform,
  globalTestPlatform as platform,
} from './TestPlatform';
import { Class, App } from '../src/core';

setGlobalTestPlatform();

const testApp = new App({
  appId: 'test-app-id',
  appKey: 'test-app-key',
  serverURL: 'test-server-url',
});

describe('Class', function () {
  describe('#add', function () {
    const Test = new Class(testApp, 'Test');

    it('should send POST request to /classes/<className>', async function () {
      platform.pushResponse({ status: 200, body: { objectId: 'test-id' } });
      await Test.add({});
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/classes/Test');
    });
  });
});
