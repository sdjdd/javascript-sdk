import * as should from 'should';
import {
  globalTestAdapter as adapter,
  setGlobalTestAdapter,
} from '../src/TestAdapter';
import { Class, App } from '../src/core';

setGlobalTestAdapter();

const testApp = new App({
  appId: 'test-app-id',
  appKey: 'test-app-key',
  serverURL: 'test-server-url',
});

describe('Class', function () {
  describe('#add', function () {
    const Test = new Class(testApp, 'Test');

    it('should send POST request to /classes/<className>', async function () {
      adapter.responses.push({ status: 200, body: { objectId: 'test-id' } });
      await Test.add({});
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.url.should.endWith('/classes/Test');
    });
  });
});
