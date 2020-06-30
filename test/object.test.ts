import 'should';
import { ObjectReference } from '../src/core';
import { TestApp } from './TestApp';

describe('ObjectReference', function () {
  describe('.set', function () {
    it('should remove reserved keys', function () {
      const app = new TestApp();
      const o = new ObjectReference(app, 'Test', 'id');
      o.update({
        objectId: '-',
        createdAt: '-',
        updatedAt: '-',
      });
      const data = app.popRequestBody();
      (data.objectId === undefined).should.true();
      (data.createdAt === undefined).should.true();
      (data.updatedAt === undefined).should.true();
    });

    it('should submit basic types', function () {
      const app = new TestApp();
      const o = new ObjectReference(app, 'Test', 'id');

      const string = 'string';
      const number = 123;
      const boolean = true;
      const array = [1, 2, 3, 4, 5];
      const object = { key: 'value' };
      o.update({ string, number, boolean, array, object });

      const data = app.requests.pop().body as Record<string, unknown>;
      data.string.should.eql(string);
      data.number.should.eql(number);
      data.boolean.should.eql(boolean);
      data.array.should.eql(array);
      data.object.should.eql(object);
    });
  });

  describe('.parseAdvancedType', function () {
    const obj: Record<string, unknown> = {
      date: new Date(),
    };
    ObjectReference.encodeAdvancedType(obj);
    const encoded = obj.date as {
      __type: string;
      iso: string;
    };
    encoded.__type.should.eql('Date');
  });
});
