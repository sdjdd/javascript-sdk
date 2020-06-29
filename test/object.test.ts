import 'should';
import { ObjectReference } from '../src/core';

describe('ObjectReference', function () {
  describe('.parseAdvancedType', function () {
    const obj = {
      date: new Date(),
    };
    ObjectReference.parseAdvancedType(obj);
    console.log(obj);
  });
});
