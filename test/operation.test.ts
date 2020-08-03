import * as should from 'should';
import { Operation } from '../src/core';

describe('Operation', function () {
  it('.delete', function () {
    Operation.delete().should.eql({ __op: 'Delete' });
  });

  it('.increment', function () {
    Operation.increment(10).should.eql({
      __op: 'Increment',
      amount: 10,
    });
  });

  it('.decrement', function () {
    Operation.decrement(10).should.eql({
      __op: 'Decrement',
      amount: 10,
    });
  });

  it('.add', function () {
    Operation.add([1, 2, 3]).should.eql({
      __op: 'Add',
      objects: [1, 2, 3],
    });
  });

  it('.addUnique', function () {
    Operation.addUnique([1, 2, 3]).should.eql({
      __op: 'AddUnique',
      objects: [1, 2, 3],
    });
  });

  it('.remove', function () {
    Operation.remove([1, 2, 3]).should.eql({
      __op: 'Remove',
      objects: [1, 2, 3],
    });
  });

  it('.bitAnd', function () {
    Operation.bitAnd(123).should.eql({
      __op: 'BitAnd',
      value: 123,
    });
  });

  it('.bitOr', function () {
    Operation.bitOr(123).should.eql({
      __op: 'BitOr',
      value: 123,
    });
  });

  it('.bitXor', function () {
    Operation.bitXor(123).should.eql({
      __op: 'BitXor',
      value: 123,
    });
  });
});
