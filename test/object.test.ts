import 'should';
import { LCObject, App } from '../src/core';
import {
  setGlobalTestPlatform,
  globalTestPlatform as platform,
} from './TestPlatform';

setGlobalTestPlatform();

const testApp = new App({
  appId: 'test-app-id',
  appKey: 'test-app-key',
  serverURL: 'test-server-url',
});

describe('LCObject', function () {
  describe('#toPointer', function () {
    it('should return a Pointer', function () {
      const obj = new LCObject('Test', 'test-id');
      const ptr = obj.toPointer();
      ptr.__type.should.eql('Pointer');
      ptr.className.should.eql(obj.className);
      ptr.objectId.should.eql(obj.objectId);
    });
  });

  describe('#update', function () {
    const app = new App({
      appId: 'test-app-id',
      appKey: 'test-app-key',
      serverURL: 'test-server-url',
    });
    const obj = new LCObject('Test', 'test-object-id', app);

    it('should send "PUT" request', async function () {
      await obj.update({});
      const req = platform.popRequest();
      req.method.should.eql('PUT');
    });

    it('should send request to correct path', async function () {
      await obj.update({});
      const req = platform.popRequest();
      req.path.should.endWith(`/${obj.className}/${obj.objectId}`);
    });

    it('should encode request body', async function () {
      const date = new Date();
      const data = { str: 'string', date };
      await obj.update(data);
      const req = platform.popRequest();
      (req.body as any).str.should.eql('string');
      (req.body as any).date.should.eql({
        __type: 'Date',
        iso: date.toISOString(),
      });
    });

    it('should remove reserved keys', async function () {
      const data = { objectId: '-', createdAt: '-', updatedAt: '-' };
      await obj.update(data);
      const req = platform.popRequest();
      ((req.body as any).objectId === undefined).should.true();
      ((req.body as any).createdAt === undefined).should.true();
      ((req.body as any).updatedAt === undefined).should.true();
    });

    it('should set "include" query when include keys', async function () {
      const include = ['key1', 'key2', 'key3'];
      await obj.update({}, { include });
      const req = platform.popRequest();
      req.query.should.eql({ include: include.join(',') });
    });
  });

  describe('#delete', function () {
    const obj = new LCObject('Test', 'test-object-id', testApp);

    it('should send "DELETE" request', async function () {
      await obj.delete();
      const req = platform.popRequest();
      req.method.should.eql('DELETE');
    });

    it('should send request to correct path', async function () {
      await obj.delete();
      const req = platform.popRequest();
      req.path.should.endWith(`/${obj.className}/${obj.objectId}`);
    });
  });

  describe('#get', function () {
    before(function () {
      platform.setDefaultResponse({
        status: 200,
        body: { className: 'Test', objectId: 'test-object-id' },
      });
    });

    after(function () {
      platform.setDefaultResponse({ status: 200, body: {} });
    });

    it('should send "GET" request', async function () {
      const obj = new LCObject('Test', 'test-object-id', testApp);
      await obj.get();
      const req = platform.popRequest();
      req.method.should.eql('GET');
    });

    it('should set correct query when include keys', async function () {
      const obj = new LCObject('Test', 'test-object-id', testApp);
      const include = ['key1', 'key2', 'key3'];
      await obj.get({ include });
      const req = platform.popRequest();
      req.query.should.eql({
        include: include.join(','),
      });
    });

    it('should return correct reference', async function () {
      const data = {
        objectId: 'test-object-id',
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };
      platform.pushResponse({ status: 200, body: data });
      const obj = new LCObject('Test', 'test-object-id', testApp);
      const newObj = await obj.get();
      platform.popRequest();
      newObj.data.should.eql(data);
    });

    it('should fail when objectId not exists', function () {
      const obj = new LCObject('Test', 'test-object-id', testApp);
      platform.pushResponse({ status: 200, body: {} });
      return obj
        .get()
        .finally(() => platform.popRequest())
        .should.rejected();
    });
  });

  describe('#toJSON', function () {
    it('should extract inner LCObject', function () {
      const obj1 = new LCObject('Test', 'id-1');
      const obj2 = new LCObject('Test', 'id-2');
      const obj3 = new LCObject('Test', 'id-3');
      obj3.data = { key3: 'value3' };
      obj2.data = { obj3, key2: 'value2' };
      obj1.data = { obj2, key1: 'value1' };
      obj1.toJSON().should.eql({
        key1: 'value1',
        obj2: { key2: 'value2', obj3: { key3: 'value3' } },
      });
    });

    it('should extract data in array', function () {
      const obj1 = new LCObject('Test', 'id-1');
      const obj2 = new LCObject('Test', 'id-2');
      obj2.data = { key2: 'value2' };
      obj1.data = { key1: 'value1', arr: [obj2] };
      obj1.toJSON().should.eql({
        key1: 'value1',
        arr: [{ key2: 'value2' }],
      });
    });

    it('should extract data in object', function () {
      const obj1 = new LCObject('Test', 'id-1');
      const obj2 = new LCObject('Test', 'id-2');
      obj2.data = { key2: 'value2' };
      obj1.data = { key1: 'value1', obj: { obj2 } };
      obj1.toJSON().should.eql({
        key1: 'value1',
        obj: { obj2: { key2: 'value2' } },
      });
    });
  });

  describe('#setApp', function () {
    it('should set app for itself', function () {
      const obj = new LCObject('Test', 'test-object-id');
      obj.setApp(testApp);
      obj.app.info.should.eql(testApp.info);
    });

    it('should set app for inner object', function () {
      const obj1 = new LCObject('Test', 'test-object-1');
      const obj2 = new LCObject('Test', 'test-object-2');
      const obj3 = new LCObject('Test', 'test-object-3');
      obj1.data = { obj2 };
      obj2.data = { obj3 };
      obj1.setApp(testApp);
      obj2.app.info.should.eql(testApp.info);
      obj3.app.info.should.eql(testApp.info);
    });
  });
});
