import 'should';
import { LCObject, App } from '../src/core';
import { IGeoPoint, IDate, IPointer } from '../src/core/types';
import { GeoPoint } from '../src/core/storage';
import { setGlobalTestPlatform, globalTestNetwork } from './TestPlatform';

setGlobalTestPlatform();

describe('ObjectReference', function () {
  describe('.encodeAdvancedType', function () {
    it('should encode Date', function () {
      const date = new Date();
      const data: Record<string, unknown> = { date };
      LCObject.encodeAdvancedType(data);
      (data.date as IDate).__type.should.eql('Date');
      (data.date as IDate).iso.should.eql(date.toISOString());
    });

    it('should encode Pointer', function () {
      const ptr = new LCObject(null, 'Test', 'test-id');
      const data: Record<string, unknown> = { ptr };
      LCObject.encodeAdvancedType(data);
      (data.ptr as IPointer).__type.should.eql('Pointer');
      (data.ptr as IPointer).className.should.eql(ptr.className);
      (data.ptr as IPointer).objectId.should.eql(ptr.objectId);
    });

    it('should encode GeoPoint', function () {
      const geo = new GeoPoint(1.5, 2.5);
      const data: Record<string, unknown> = { geo };
      LCObject.encodeAdvancedType(data);
      (data.geo as IGeoPoint).__type.should.eql('GeoPoint');
      (data.geo as IGeoPoint).latitude.should.eql(geo.latitude);
      (data.geo as IGeoPoint).longitude.should.eql(geo.longitude);
    });

    it('should encode data which in a sub-object', function () {
      const date = new Date();
      const data = { obj: { date, obj: { date } } };
      LCObject.encodeAdvancedType(data);
      [data.obj.date, data.obj.obj.date].forEach((t) => {
        ((t as unknown) as IDate).__type.should.eql('Date');
        ((t as unknown) as IDate).iso.should.eql(date.toISOString());
      });
    });

    it('should encode data which in a sub-array', function () {
      const date = new Date();
      const data = { arr: [date, [date]] };
      LCObject.encodeAdvancedType(data);
      [data.arr[0], data.arr[1][0]].forEach((t) => {
        ((t as unknown) as IDate).__type.should.eql('Date');
        ((t as unknown) as IDate).iso.should.eql(date.toISOString());
      });
    });
  });

  describe('.decodeAdvancedType', function () {
    it('should decode Date', function () {
      const date: IDate = {
        __type: 'Date',
        iso: '2020-01-02T03:04:05.061Z',
      };
      const data: Record<string, unknown> = { date };
      LCObject.decodeAdvancedType(null, data);
      data.date.should.instanceOf(Date);
      (data.date as Date).toISOString().should.eql(date.iso);
    });

    it('should decode Pointer', function () {
      const ptr: IPointer = {
        __type: 'Pointer',
        className: 'Test',
        objectId: 'test-id',
      };
      const app = new App({
        appId: 'test-id',
        appKey: 'test-key',
        serverURL: 'test-url',
      });
      const data: Record<string, unknown> = { ptr: { ...ptr } };
      LCObject.decodeAdvancedType(app, data);
      data.ptr.should.instanceOf(LCObject);
      (data.ptr as LCObject).app.info.appId.should.eql(app.info.appId);
      (data.ptr as LCObject).className.should.eql(ptr.className);
      (data.ptr as LCObject).objectId.should.eql(ptr.objectId);
    });

    it('should decode GeoPoint', function () {
      const geo: IGeoPoint = {
        __type: 'GeoPoint',
        latitude: 1.5,
        longitude: 2.5,
      };
      const data: Record<string, unknown> = { geo };
      LCObject.decodeAdvancedType(null, data);
      data.geo.should.instanceOf(GeoPoint);
      (data.geo as GeoPoint).latitude.should.eql(geo.latitude);
      (data.geo as GeoPoint).longitude.should.eql(geo.longitude);
    });

    it('should decode data which in a sub-object', function () {
      const date: IDate = {
        __type: 'Date',
        iso: '2020-01-02T03:04:05.061Z',
      };
      const data = { obj: { date, obj: { date } } };
      LCObject.decodeAdvancedType(null, data);
      [data.obj.date, data.obj.obj.date].forEach((t) => {
        t.should.instanceOf(Date);
        ((t as unknown) as Date).toISOString().should.eql(date.iso);
      });
    });

    it('should decode data which in a sub-array', function () {
      const date: IDate = {
        __type: 'Date',
        iso: '2020-01-02T03:04:05.061Z',
      };
      const data = { arr: [date, [date]] };
      LCObject.decodeAdvancedType(null, data);
      [data.arr[0], data.arr[1][0]].forEach((t) => {
        t.should.instanceOf(Date);
        ((t as unknown) as Date).toISOString().should.eql(date.iso);
      });
    });
  });

  describe('#toJSON', function () {
    it('should return a Pointer', function () {
      const obj = new LCObject(null, 'Test', 'test-id');
      const ptr = obj.toJSON();
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
    const obj = new LCObject(app, 'Test', 'test-object-id');

    it('should send "PUT" request', async function () {
      await obj.update({});
      const req = globalTestNetwork.popRequest();
      req.method.should.eql('PUT');
    });

    it('should send request to correct path', async function () {
      await obj.update({});
      const req = globalTestNetwork.popRequest();
      req.path.should.endWith(`/${obj.className}/${obj.objectId}`);
    });

    it('should set correct request body', async function () {
      const data = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };
      await obj.update(data);
      const req = globalTestNetwork.popRequest();
      req.body.should.eql(data);
    });

    it('should remove reserved keys', async function () {
      const data = { objectId: '-', createdAt: '-', updatedAt: '-' };
      await obj.update(data);
      const req = globalTestNetwork.popRequest();
      ((req.body as any).objectId === undefined).should.true();
      ((req.body as any).createdAt === undefined).should.true();
      ((req.body as any).updatedAt === undefined).should.true();
    });

    it('should set correct query when include keys', async function () {
      const include = ['key1', 'key2', 'key3'];
      await obj.update({}, { include });
      const req = globalTestNetwork.popRequest();
      req.query.should.eql({
        include: include.join(','),
      });
    });
  });

  describe('#delete', function () {
    const app = new App({
      appId: 'test-app-id',
      appKey: 'test-app-key',
      serverURL: 'test-server-url',
    });
    const obj = new LCObject(app, 'Test', 'test-object-id');

    it('should send "DELETE" request', async function () {
      await obj.delete();
      const req = globalTestNetwork.popRequest();
      req.method.should.eql('DELETE');
    });

    it('should send request to correct path', async function () {
      await obj.delete();
      const req = globalTestNetwork.popRequest();
      req.path.should.endWith(`/${obj.className}/${obj.objectId}`);
    });
  });

  describe('#get', function () {
    const app = new App({
      appId: 'test-app-id',
      appKey: 'test-app-key',
      serverURL: 'test-server-url',
    });
    const obj = new LCObject(app, 'Test', 'test-object-id');

    it('should send "GET" request', async function () {
      await obj.get();
      const req = globalTestNetwork.popRequest();
      req.method.should.eql('GET');
    });

    it('should set correct query when include keys', async function () {
      const include = ['key1', 'key2', 'key3'];
      await obj.get({ include });
      const req = globalTestNetwork.popRequest();
      req.query.should.eql({
        include: include.join(','),
      });
    });

    it('should return correct reference', async function () {
      const data = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };
      globalTestNetwork.pushResponse({ status: 200, body: data });
      const newObj = await obj.get();
      globalTestNetwork.popRequest();
      newObj.data.should.eql(data);
    });
  });
});
