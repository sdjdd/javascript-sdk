import 'should';
import { LCObject, App } from '../src/core';
import { IGeoPoint, IDate, IPointer } from '../src/core/types';
import { GeoPoint } from '../src/core/storage';
import { setGlobalTestPlatform, globalTestNetwork } from './TestPlatform';

setGlobalTestPlatform();

describe('LCObject', function () {
  describe('.encodeData', function () {
    it('should encode Date', function () {
      const date = new Date();
      const data = LCObject.encodeData({ date });
      (data.date as IDate).__type.should.eql('Date');
      (data.date as IDate).iso.should.eql(date.toISOString());
    });

    it('should encode Pointer', function () {
      const ptr = new LCObject(null, 'Test', 'test-id');
      const data = LCObject.encodeData({ ptr });
      (data.ptr as IPointer).__type.should.eql('Pointer');
      (data.ptr as IPointer).className.should.eql(ptr.className);
      (data.ptr as IPointer).objectId.should.eql(ptr.objectId);
    });

    it('should encode GeoPoint', function () {
      const geo = new GeoPoint(1.5, 2.5);
      const data: Record<string, unknown> = { geo };
      LCObject.encodeData(data);
      (data.geo as IGeoPoint).__type.should.eql('GeoPoint');
      (data.geo as IGeoPoint).latitude.should.eql(geo.latitude);
      (data.geo as IGeoPoint).longitude.should.eql(geo.longitude);
    });

    it('should encode data which in a sub-object', function () {
      const date = new Date();
      const data = LCObject.encodeData({ obj: { date, obj: { date } } }) as any;
      [(data.obj.date, data.obj.obj.date)].forEach((t) => {
        ((t as unknown) as IDate).__type.should.eql('Date');
        ((t as unknown) as IDate).iso.should.eql(date.toISOString());
      });
    });

    it('should encode data which in a sub-array', function () {
      const date = new Date();
      const data = LCObject.encodeData({ arr: [date, [date]] });
      [data.arr[0], data.arr[1][0]].forEach((t) => {
        ((t as unknown) as IDate).__type.should.eql('Date');
        ((t as unknown) as IDate).iso.should.eql(date.toISOString());
      });
    });

    it('should keep basic value stay the same', function () {
      const data = LCObject.encodeData({
        key1: 'value1',
        key2: 'value2',
      });
      data.key1.should.eql('value1');
      data.key2.should.eql('value2');
    });
  });

  describe('.decode', function () {
    it('should decode Date', function () {
      const date: IDate = {
        __type: 'Date',
        iso: '2020-01-02T03:04:05.061Z',
      };
      const obj = LCObject.decode({ date }, null);
      obj.data.date.should.instanceOf(Date);
      (obj.data.date as Date).toISOString().should.eql(date.iso);
    });

    it('should decode Pointer', function () {
      const ptr: IPointer = {
        __type: 'Pointer',
        className: 'Test',
        objectId: 'test-id',
        key1: 'value1',
        key2: 'value2',
      };
      const app = new App({
        appId: 'test-id',
        appKey: 'test-key',
        serverURL: 'test-url',
      });
      const obj = LCObject.decode({ ptr: { ...ptr } }, app);
      obj.data.ptr.should.instanceOf(LCObject);
      (obj.data.ptr as LCObject).app.info.appId.should.eql(app.info.appId);
      (obj.data.ptr as LCObject).className.should.eql(ptr.className);
      (obj.data.ptr as LCObject).objectId.should.eql(ptr.objectId);
      (obj.data.ptr as LCObject).data.key1.should.eql(ptr.key1);
      (obj.data.ptr as LCObject).data.key2.should.eql(ptr.key2);
    });

    it('should decode GeoPoint', function () {
      const geo: IGeoPoint = {
        __type: 'GeoPoint',
        latitude: 1.5,
        longitude: 2.5,
      };
      const obj = LCObject.decode({ geo }, null);
      obj.data.geo.should.instanceOf(GeoPoint);
      (obj.data.geo as GeoPoint).latitude.should.eql(geo.latitude);
      (obj.data.geo as GeoPoint).longitude.should.eql(geo.longitude);
    });

    it('should decode data which in a sub-object', function () {
      const date: IDate = {
        __type: 'Date',
        iso: '2020-01-02T03:04:05.061Z',
      };
      const obj = LCObject.decode({ obj: { date, obj: { date } } }, null);
      const data = obj.data as any;
      [(data.obj.date, data.obj.obj.date)].forEach((t) => {
        t.should.instanceOf(Date);
        ((t as unknown) as Date).toISOString().should.eql(date.iso);
      });
    });

    it('should decode data which in a sub-array', function () {
      const date: IDate = {
        __type: 'Date',
        iso: '2020-01-02T03:04:05.061Z',
      };
      const obj = LCObject.decode({ arr: [date, [date]] }, null);
      const data = obj.data;
      data.arr.should.Array();
      [(data.arr[0], data.arr[1][0])].forEach((t) => {
        t.should.instanceOf(Date);
        ((t as unknown) as Date).toISOString().should.eql(date.iso);
      });
    });

    it('should encode createdAt and updatedAt', function () {
      const data: Record<string, unknown> = {
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      LCObject.decode(data, null);
      data.createdAt.should.instanceOf(Date);
      data.updatedAt.should.instanceOf(Date);
    });
  });

  describe('#toPointer', function () {
    it('should return a Pointer', function () {
      const obj = new LCObject(null, 'Test', 'test-id');
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

    it('should encode request body', async function () {
      const date = new Date();
      const data = { str: 'string', date };
      await obj.update(data);
      const req = globalTestNetwork.popRequest();
      (req.body as any).str.should.eql('string');
      (req.body as any).date.should.eql({
        __type: 'Date',
        iso: date.toISOString(),
      });
    });

    it('should remove reserved keys', async function () {
      const data = { objectId: '-', createdAt: '-', updatedAt: '-' };
      await obj.update(data);
      const req = globalTestNetwork.popRequest();
      ((req.body as any).objectId === undefined).should.true();
      ((req.body as any).createdAt === undefined).should.true();
      ((req.body as any).updatedAt === undefined).should.true();
    });

    it('should set "include" query when include keys', async function () {
      const include = ['key1', 'key2', 'key3'];
      await obj.update({}, { include });
      const req = globalTestNetwork.popRequest();
      req.query.should.eql({ include: include.join(',') });
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

  describe('#toJSON', function () {
    it('should extract inner LCObject', function () {
      const obj1 = new LCObject(null, 'Test', 'id-1');
      const obj2 = new LCObject(null, 'Test', 'id-2');
      const obj3 = new LCObject(null, 'Test', 'id-3');
      obj3.data = { key3: 'value3' };
      obj2.data = { obj3, key2: 'value2' };
      obj1.data = { obj2, key1: 'value1' };
      obj1.toJSON().should.eql({
        key1: 'value1',
        obj2: { key2: 'value2', obj3: { key3: 'value3' } },
      });
    });

    it('should extract array of LCObject', function () {
      const obj1 = new LCObject(null, 'Test', 'id-1');
      const obj2 = new LCObject(null, 'Test', 'id-2');
      obj2.data = { key2: 'value2' };
      obj1.data = { key1: 'value1', arr: [obj2] };
      obj1.toJSON().should.eql({
        key1: 'value1',
        arr: [{ key2: 'value2' }],
      });
    });

    it('should extract kv-map of LCObject', function () {
      const obj1 = new LCObject(null, 'Test', 'id-1');
      const obj2 = new LCObject(null, 'Test', 'id-2');
      obj2.data = { key2: 'value2' };
      obj1.data = { key1: 'value1', obj: { obj2 } };
      obj1.toJSON().should.eql({
        key1: 'value1',
        obj: { obj2: { key2: 'value2' } },
      });
    });
  });
});
