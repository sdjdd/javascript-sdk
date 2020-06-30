import 'should';
import { ObjectReference } from '../src/core';

describe('ObjectReference', function () {
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
