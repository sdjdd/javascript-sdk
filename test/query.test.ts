import 'should';
import { App, Query } from '../src/core';
import {
  setGlobalTestPlatform,
  globalTestPlatform as platform,
} from './TestPlatform';

setGlobalTestPlatform();

describe('Query', function () {
  const app = new App({
    appId: 'test-app-id',
    appKey: 'test-app-key',
    serverURL: 'test-server-url',
  });
  const Test = new Query(app, 'Test');

  describe('#where', function () {
    it('where("key", "==", "value")', async function () {
      await Test.where('key', '==', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":"value"}');
    });

    it('where("key", "!=", "value")', async function () {
      await Test.where('key', '!=', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$ne":"value"}}');
    });

    it('where("key", "<", "value")', async function () {
      await Test.where('key', '<', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$lt":"value"}}');
    });

    it('where("key", "<=", "value")', async function () {
      await Test.where('key', '<=', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$lte":"value"}}');
    });

    it('where("key", ">", "value")', async function () {
      await Test.where('key', '>', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$gt":"value"}}');
    });

    it('where("key", ">=", "value")', async function () {
      await Test.where('key', '>=', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$gte":"value"}}');
    });

    it('where("key", "exists")', async function () {
      await Test.where('key', 'exists').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$exists":true}}');
    });

    it('where("key", "not-exists")', async function () {
      await Test.where('key', 'not-exists').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$exists":false}}');
    });

    it('where("key", "has", "value")', async function () {
      await Test.where('key', 'has', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":"value"}');
    });

    it('where("key", "has", ["value1", "value2"])', async function () {
      await Test.where('key', 'has', ['value1', 'value2']).find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$all":["value1","value2"]}}');
    });

    it('where("key", "has-any", ["value1", "value2"])', async function () {
      await Test.where('key', 'has-any', ['value1', 'value2']).find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$in":["value1","value2"]}}');
    });

    it('where("key", "size-is", 5)', async function () {
      await Test.where('key', 'size-is', 5).find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":{"$size":5}}');
    });

    it('should set correct WHERE when do $select query', async function () {
      const Country = new Query(app, 'Country');
      const Student = new Query(app, 'Student');
      await Student.where(
        'nationality',
        'in',
        Country.select('name').where('language', '==', 'English')
      ).find();
      const req = platform.popRequest();
      req.query.where.should.eql(
        JSON.stringify({
          nationality: {
            $select: {
              key: 'name',
              query: { className: 'Country', where: { language: 'English' } },
            },
          },
        })
      );
    });

    it('should use single WHERE when key is different', async function () {
      await Test.where('key1', '==', 'value')
        .where('key2', '==', 'value')
        .find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key1":"value","key2":"value"}');
    });

    it('should use multiple WHERE when keys are the same', async function () {
      await Test.where('key1', '>', 'value1')
        .where('key1', '<', 'value2')
        .find();
      const req = platform.popRequest();
      req.query.where.should.eql(
        JSON.stringify({
          $and: [{ key1: { $gt: 'value1' } }, { key1: { $lt: 'value2' } }],
        })
      );
    });
  });

  describe('#clone', function () {
    it('should return an identical Query', function () {
      const query1 = Test.select('key1', 'key2')
        .where('key1', '==', 'value1')
        .or()
        .where('key2', '==', 'value2')
        .orderBy('key2')
        .limit(10)
        .skip(20);
      const query2 = query1.clone();
      const t1 = query1 as any;
      const t2 = query2 as any;
      (t1._and !== t2._and).should.true();
      t1._and.should.eql(t2._and);
      (t1._or !== t2._or).should.true();
      t1._or.should.eql(t2._or);
      t1._limit.should.eql(t2._limit);
      t1._skip.should.eql(t2._skip);
      (t1._orderBy !== t2._orderBy).should.true();
      t1._orderBy.should.eql(t2._orderBy);
      (t1._select !== t2._select).should.true();
      t1._select.should.eql(t2._select);
    });
  });
});
