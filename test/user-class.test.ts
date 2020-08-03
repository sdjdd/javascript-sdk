import * as should from 'should';
import { v4 as uuid } from 'uuid';
import { App, KEY_CURRENT_USER, User, UserClass } from '../src/core';
import {
  globalTestAdapter as adapter,
  setGlobalTestAdapter,
} from '../src/TestAdapter';

setGlobalTestAdapter();

const testApp = new App({
  appId: 'test-app-id',
  appKey: 'test-app-key',
  serverURL: 'test-server-url',
});

describe('UserClass', function () {
  describe('._setCurrent', function () {
    it('should set User', function () {
      const user = new User('test-id');
      user.data = {
        objectId: user.objectId,
        sessionToken: 'test-session',
        username: 'test',
      };
      UserClass._setCurrentUser(testApp, user);
      const userObj = JSON.parse(testApp._kvGet(KEY_CURRENT_USER));
      userObj.sessionToken.should.eql('test-session');
      userObj.objectId.should.eql('test-id');
      userObj.username.should.eql('test');
    });
  });

  describe('.current', function () {
    it('should get current User', function () {
      testApp._kvSet(
        KEY_CURRENT_USER,
        '{"sessionToken":"test-session","objectId":"test-id","username":"test","className":"_User"}'
      );
      const user = UserClass._getCurrentUser(testApp);
      user.objectId.should.eql('test-id');
      user.sessionToken.should.eql('test-session');
      user.data.username.should.eql('test');
    });
  });

  describe('#become', function () {
    it('should fetch user info by sessionToken', async function () {
      const User = new UserClass(testApp);
      adapter.responses.push({
        status: 200,
        body: { objectId: 'test-id' },
      });
      await User.become('test-session');
      const req = adapter.requests.pop();
      req.method.should.eql('GET');
      testApp.setSessionToken('should-be-overrided');
      req.header['X-LC-Session'].should.eql('test-session');
    });

    it('should set current user', async function () {
      const objectId = uuid();
      const User = new UserClass(testApp);
      adapter.responses.push({
        status: 200,
        body: { objectId },
      });
      await User.become('test-session');
      adapter.requests.pop();
      User.current().objectId.should.eql(objectId);
    });
  });

  describe('#signUp', function () {
    const User = new UserClass(testApp);
    it('should require username', function () {
      return User.signUp({}).should.rejectedWith(/username/);
    });

    it('should require password', function () {
      return User.signUp({ username: '-' }).should.rejectedWith(/password/);
    });

    it('should send POST request to /users', async function () {
      adapter.responses.push({
        status: 200,
        body: { objectId: 'wufhqle4r3ifri3f4frw' },
      });
      await User.signUp({ username: 'test', password: 'secret' });
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/users');
    });

    it('should set current user', async function () {
      const objectId = uuid();
      adapter.responses.push({
        status: 200,
        body: { objectId, username: 'test' },
      });
      await User.signUp({ username: 'test', password: 'secret' });
      adapter.requests.pop();
      const currentUser = User.current();
      currentUser.objectId.should.eql(objectId);
      currentUser.data.username.should.eql('test');
    });
  });

  describe('#_logInWithData', function () {
    const User = new UserClass(testApp);

    it('should send POST request to /login', async function () {
      adapter.responses.push({
        status: 200,
        body: { objectId: 'test-id' },
      });
      const _logInWithData = Reflect.get(User, '_logInWithData').bind(User);
      await _logInWithData({});
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/login');
    });

    it('should set current User', async function () {
      const objectId = uuid();
      adapter.responses.push({
        status: 200,
        body: { objectId, username: 'test' },
      });
      const _logInWithData = Reflect.get(User, '_logInWithData').bind(User);
      await _logInWithData({});
      adapter.requests.pop();
      const currentUser = User.current();
      currentUser.objectId.should.eql(objectId);
      currentUser.data.username.should.eql('test');
    });
  });

  describe('logInWithAuthData', function () {
    const User = new UserClass(testApp);

    it('should send POST to /users', async function () {
      adapter.responses.push({ status: 200, body: { objectId: 'test-id' } });
      await User.logInWithAuthData('test-platform', {});
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/users');
    });

    it('should set authData to body.authData[platform]', async function () {
      adapter.responses.push({ status: 200, body: { objectId: 'test-id' } });
      await User.logInWithAuthData('test-platform', { key: 'value' });
      const req = adapter.requests.pop();
      (req.body as any).authData['test-platform'].key.should.eql('value');
    });
  });

  describe('#logOut', function () {
    const User = new UserClass(testApp);

    it('should set sessionToken of App to null', function () {
      testApp.setSessionToken('something');
      User.logOut();
      (Reflect.get(testApp, '_sessionToken') === null).should.true();
    });

    it('should remove currentUser in kv of App', function () {
      testApp._kvSet(KEY_CURRENT_USER, 'something');
      User.logOut();
      should.not.exist(testApp._kvGet(KEY_CURRENT_USER));
    });
  });

  describe('#requestEmailVerify', function () {
    it('should send POST request to /requestEmailVerify', async function () {
      const User = new UserClass(testApp);
      await User.requestEmailVerify('i@example.com');
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/requestEmailVerify');
      req.body.should.eql({ email: 'i@example.com' });
    });
  });

  describe('#requestLoginSmsCode', function () {
    it('should send POST request to /requestEmailVerify', async function () {
      const User = new UserClass(testApp);
      await User.requestLoginSmsCode('123456789');
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/requestLoginSmsCode');
      req.body.should.eql({ mobilePhoneNumber: '123456789' });
    });
  });

  describe('#requestMobilePhoneVerify', function () {
    it('should send POST request to /requestMobilePhoneVerify', async function () {
      const User = new UserClass(testApp);
      await User.requestMobilePhoneVerify('123456789');
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/requestMobilePhoneVerify');
      req.body.should.eql({ mobilePhoneNumber: '123456789' });
    });
  });

  describe('#requestPasswordReset', function () {
    it('should send POST request to /requestPasswordReset', async function () {
      const User = new UserClass(testApp);
      await User.requestPasswordReset('i@example.com');
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/requestPasswordReset');
      req.body.should.eql({ email: 'i@example.com' });
    });
  });

  describe('#requestPasswordResetBySmsCode', function () {
    it('should send POST request to /requestPasswordResetBySmsCode', async function () {
      const User = new UserClass(testApp);
      await User.requestPasswordResetBySmsCode('123456789');
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/requestPasswordResetBySmsCode');
      req.body.should.eql({ mobilePhoneNumber: '123456789' });
    });
  });

  describe('#resetPasswordBySmsCode', function () {
    it('should send PUT request to /resetPasswordBySmsCode/<code>', async function () {
      const User = new UserClass(testApp);
      await User.resetPasswordBySmsCode('123456', 'secret');
      const req = adapter.requests.pop();
      req.method.should.eql('PUT');
      req.path.should.endWith('/resetPasswordBySmsCode/123456');
      req.body.should.eql({ password: 'secret' });
    });
  });

  describe('#verifyMobilePhone', function () {
    it('should send POST request to /verifyMobilePhone/<code>', async function () {
      const User = new UserClass(testApp);
      await User.verifyMobilePhone('123456');
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/verifyMobilePhone/123456');
    });
  });

  describe('#requestChangePhoneNumber', function () {
    const User = new UserClass(testApp);

    it('should sent POST request to /requestChangePhoneNumber', async function () {
      await User.requestChangePhoneNumber('phone-number', 30);
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/requestChangePhoneNumber');
    });

    it('should submit mobilePhoneNumber & ttl', async function () {
      await User.requestChangePhoneNumber('phone-number', 30);
      const req = adapter.requests.pop();
      req.body.should.eql({
        mobilePhoneNumber: 'phone-number',
        ttl: 30,
      });
    });
  });

  describe('#changeMobilePhone', function () {
    const User = new UserClass(testApp);

    it('should send POST request to /changePhoneNumber', async function () {
      await User.changePhoneNumber('_', '_');
      const req = adapter.requests.pop();
      req.method.should.eql('POST');
      req.path.should.endWith('/changePhoneNumber');
    });

    it('should submit mobilePhoneNumber & code', async function () {
      await User.changePhoneNumber('phone-number', 'code');
      const req = adapter.requests.pop();
      req.body.should.eql({
        mobilePhoneNumber: 'phone-number',
        code: 'code',
      });
    });
  });
});
