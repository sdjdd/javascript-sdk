import { default as should } from 'should';
import { App, Query } from '../src/core';
import {
  setGlobalTestPlatform,
  globalTestPlatform as platform,
} from './TestPlatform';

setGlobalTestPlatform();

const app = new App({
  appId: 'test-app-id',
  appKey: 'test-app-key',
  serverURL: 'test-server-url',
});

describe('Query', function () {
  const Test = new Query(app, 'Test');

  describe('.and', function () {
    it('should throws when get less than 2 parameters', function () {
      should.throws(() => Query.and());
      should.throws(() => Query.and(Test));
      should.doesNotThrow(() => Query.and(Test, Test));
    });

    it('should throws when queries not belongs to same Class', function () {
      const Test2 = new Query(app, 'Test2');
      should.throws(() => Query.and(Test, Test2));
    });

    it('should throws when queries not belongs to same App', function () {
      const anotherApp = new App({
        appId: 'test-another-app-id',
        appKey: 'test-app-key',
        serverURL: 'test-server-url',
      });
      const Test2 = new Query(anotherApp, 'Test');
      should.throws(() => Query.and(Test, Test2));
    });

    it('should cascade queries by _and', function () {
      const q1 = Test.where('key1', '==', 'value1');
      const q2 = Test.where('key2', '==', 'value2');
      const query = Query.and(q1, q2);
      const _and = Reflect.get(query, '_and');
      _and.should.eql([q1._parseWhere(), q2._parseWhere()]);
    });
  });

  describe('.or', function () {
    it('should throws when get less than 2 parameters', function () {
      should.throws(() => Query.or());
      should.throws(() => Query.or(Test));
      should.doesNotThrow(() => Query.or(Test, Test));
    });

    it('should throws when queries not belongs to same Class', function () {
      const Test2 = new Query(app, 'Test2');
      should.throws(() => Query.or(Test, Test2));
    });

    it('should throws when queries not belongs to same App', function () {
      const anotherApp = new App({
        appId: 'test-another-app-id',
        appKey: 'test-app-key',
        serverURL: 'test-server-url',
      });
      const Test2 = new Query(anotherApp, 'Test');
      should.throws(() => Query.or(Test, Test2));
    });

    it('should cascade queries by _or', function () {
      const q1 = Test.where('key1', '==', 'value1');
      const q2 = Test.where('key2', '==', 'value2');
      const query = Query.or(q1, q2);
      const _and = Reflect.get(query, '_or');
      _and.should.eql([q1._parseWhere(), q2._parseWhere()]);
    });
  });

  describe('#select', function () {
    it('should add keys to _select', function () {
      const query = Test.select('key1', 'key2', 'key3');
      const _select = Reflect.get(query, '_select');
      _select.should.eql(new Set(['key1', 'key2', 'key3']));
    });

    it('should remove same key with prefix "-"', function () {
      const query = Test.clone();
      Reflect.get(query, '_select').add('-key');
      Reflect.get(query.select('key'), '_select').has('-key').should.false();
    });
  });

  describe('#except', function () {
    it('should add keys  with prefix "-" to _select', function () {
      const query = Test.except('key1', 'key2', 'key3');
      const _select = Reflect.get(query, '_select');
      _select.should.eql(new Set(['-key1', '-key2', '-key3']));
    });

    it('should remove same key without prefix "-"', function () {
      const query = Test.clone();
      Reflect.get(query, '_select').add('key');
      Reflect.get(query.except('key'), '_select').has('key').should.false();
    });
  });

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

    it('where("key", "has-any", "value")', async function () {
      await Test.where('key', 'has-any', 'value').find();
      const req = platform.popRequest();
      req.query.where.should.eql('{"key":"value"}');
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

    it('where("key", "matchs", "value")', function () {
      Test.where('key', 'matchs', 'value')
        ._parseWhere()
        .should.eql({
          key: { $regex: 'value' },
        });
    });

    it('where("key", "matchs", /^value$/ims', function () {
      Test.where('key', 'matchs', /^value$/ims)
        ._parseWhere()
        .should.eql({
          key: { $regex: '^value$', $options: 'ims' },
        });
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

    it('should set correct WHERE when do $inQuery query', async function () {
      const Comment = new Query(app, 'Comment');
      const Post = new Query(app, 'Post');
      await Comment.where(
        'post',
        'in',
        Post.where('objectId', '==', 'test-id')
      ).find();
      const req = platform.popRequest();
      req.query.where.should.eql(
        JSON.stringify({
          post: {
            $inQuery: {
              className: 'Post',
              where: { objectId: 'test-id' },
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

    it('should throws when value of "size-is" is not a number', function () {
      should.throws(() => Test.where('key', 'size-is', 'not-a-number'));
    });

    it('should throws when value of "in" is not a Query', function () {
      should.throws(() => Test.where('key', 'in', 'not-a-query'));
    });

    it('should throws when value of "in" contains multiple select', function () {
      should.throws(() => Test.where('key', 'in', Test.select('key1', 'key2')));
    });
  });

  describe('#count', function () {
    it('should set count to 1 and limit to 0', async function () {
      await Test.count();
      const req = platform.popRequest();
      req.query.should.eql({ count: '1', limit: '0' });
    });

    it('should return count of results', async function () {
      platform.pushResponse({ status: 200, body: { count: 10 } });
      const count = await Test.count();
      count.should.eql(10);
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
