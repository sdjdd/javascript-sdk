import 'should';
import { ObjectEncoder, ObjectDecoder } from '../src/core/storage/encoding';
import { IPointer, IGeoPoint, IDate } from '../src/core/types';
import { LCObject, GeoPoint, App } from '../src/core';

describe('ObjectEncoder', function () {
  describe('.encodeData', function () {
    it('should encode Date', function () {
      const date = new Date();
      const data = ObjectEncoder.encodeData({ date }) as { date: IDate };
      data.date.__type.should.eql('Date');
      data.date.iso.should.eql(date.toISOString());
    });

    it('should encode Pointer', function () {
      const obj = new LCObject(null, 'Test', 'test-id');
      const data = ObjectEncoder.encodeData({ obj }) as { obj: IPointer };
      data.obj.__type.should.eql('Pointer');
      data.obj.className.should.eql('Test');
      data.obj.objectId.should.eql('test-id');
    });

    it('should encode GeoPoint', function () {
      const geo = new GeoPoint(10.5, 20.5);
      const data = ObjectEncoder.encodeData({ geo }) as { geo: IGeoPoint };
      data.geo.__type.should.eql('GeoPoint');
      data.geo.latitude.should.eql(geo.latitude);
      data.geo.longitude.should.eql(geo.longitude);
    });

    it('should encode data in object', function () {
      const date = new Date();
      const data = ObjectEncoder.encodeData({
        obj: { date, obj: { date } },
      }) as {
        obj: { date: IDate; obj: { date: IDate } };
      };
      [data.obj.date, data.obj.obj.date].forEach((d) => {
        d.__type.should.eql('Date');
        d.iso.should.eql(date.toISOString());
      });
    });

    it('should encode data in array', function () {
      const date = new Date();
      const data = ObjectEncoder.encodeData({
        arr: [date, [date]],
      }) as {
        arr: [IDate, [IDate]];
      };
      [data.arr[0], data.arr[1][0]].forEach((d) => {
        d.__type.should.eql('Date');
        d.iso.should.eql(date.toISOString());
      });
    });

    it('should keep basic value stay', function () {
      const data = ObjectEncoder.encodeData({ key: 'value' }) as {
        key: string;
      };
      data.key.should.eql('value');
    });
  });
});

describe('ObjectDecoder', function () {
  describe('.decodeData', function () {
    it('should decode Date', function () {
      const date: IDate = { __type: 'Date', iso: '2020-01-02T03:04:05.061Z' };
      const data = ObjectDecoder.decodeData({ date }, null) as { date: Date };
      data.date.should.instanceOf(Date);
      data.date.toISOString().should.eql(date.iso);
    });

    it('should decode Pointer', function () {
      const ptr: IPointer = {
        __type: 'Pointer',
        className: 'Test',
        objectId: 'test-id',
        key: 'value',
      };
      const appInfo = {
        appId: 'test-app-id',
        appKey: 'test-app-key',
        serverURL: 'test-server-url',
      };
      const app = new App(appInfo);
      const data = ObjectDecoder.decodeData({ ptr }, app) as { ptr: LCObject };
      data.ptr.should.instanceOf(LCObject);
      data.ptr.app.info.should.eql(appInfo);
      data.ptr.className.should.eql(ptr.className);
      data.ptr.objectId.should.eql(ptr.objectId);
      data.ptr.data.key.should.eql(ptr.key);
    });

    it('should decode GeoPoint', function () {
      const geo: IGeoPoint = {
        __type: 'GeoPoint',
        latitude: 10.5,
        longitude: 20.5,
      };
      const data = ObjectDecoder.decodeData({ geo }, null) as { geo: GeoPoint };
      data.geo.should.instanceOf(GeoPoint);
      data.geo.latitude.should.eql(geo.latitude);
      data.geo.longitude.should.eql(geo.longitude);
    });

    it('should decode data in object', function () {
      const date: IDate = { __type: 'Date', iso: '2020-01-02T03:04:05.061Z' };
      const data = ObjectDecoder.decodeData(
        { obj: { date, obj: { date } } },
        null
      ) as { obj: { date: Date; obj: { date: Date } } };
      [data.obj.date, data.obj.obj.date].forEach((d) => {
        d.should.instanceOf(Date);
        d.toISOString().should.eql(date.iso);
      });
    });

    it('should decode date in array', function () {
      const date: IDate = { __type: 'Date', iso: '2020-01-02T03:04:05.061Z' };
      const data = ObjectDecoder.decodeData({ arr: [date, [date]] }, null) as {
        arr: [Date, [Date]];
      };
      [data.arr[0], data.arr[1][0]].forEach((d) => {
        d.should.instanceOf(Date);
        d.toISOString().should.eql(date.iso);
      });
    });

    it('should keep basic value stay', function () {
      const data = ObjectDecoder.decodeData({ key: 'value' }, null) as {
        key: string;
      };
      data.key.should.eql('value');
    });
  });
});
