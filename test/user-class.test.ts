import 'should';
import { v4 as uuid } from 'uuid';
import { App, KEY_CURRENT_USER, User, UserClass } from '../src/core';
import {
  setGlobalTestPlatform,
  globalTestPlatform as platform,
} from './TestPlatform';

setGlobalTestPlatform();

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
      platform.pushResponse({
        status: 200,
        body: { objectId: 'test-id' },
      });
      await User.become('test-session');
      const req = platform.popRequest();
      req.method.should.eql('GET');
      testApp.setSessionToken('should-be-overrided');
      req.header['X-LC-Session'].should.eql('test-session');
    });

    it('should set current user', async function () {
      const objectId = uuid();
      const User = new UserClass(testApp);
      platform.pushResponse({
        status: 200,
        body: { objectId },
      });
      await User.become('test-session');
      platform.popRequest();
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
      platform.pushResponse({
        status: 200,
        body: { objectId: 'wufhqle4r3ifri3f4frw' },
      });
      await User.signUp({ username: 'test', password: 'secret' });
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/users');
    });

    it('should set current user', async function () {
      const objectId = uuid();
      platform.pushResponse({
        status: 200,
        body: { objectId, username: 'test' },
      });
      await User.signUp({ username: 'test', password: 'secret' });
      platform.popRequest();
      const currentUser = User.current();
      currentUser.objectId.should.eql(objectId);
      currentUser.data.username.should.eql('test');
    });
  });

  describe('#_logInWithData', function () {
    const User = new UserClass(testApp);

    it('should send POST request to /login', async function () {
      platform.pushResponse({
        status: 200,
        body: { objectId: 'test-id' },
      });
      const _logInWithData = Reflect.get(User, '_logInWithData').bind(User);
      await _logInWithData({});
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/login');
    });

    it('should set current User', async function () {
      const objectId = uuid();
      platform.pushResponse({
        status: 200,
        body: { objectId, username: 'test' },
      });
      const _logInWithData = Reflect.get(User, '_logInWithData').bind(User);
      await _logInWithData({});
      platform.popRequest();
      const currentUser = User.current();
      currentUser.objectId.should.eql(objectId);
      currentUser.data.username.should.eql('test');
    });
  });

  describe('logInWithAuthData', function () {
    const User = new UserClass(testApp);

    it('should send POST to /users', async function () {
      platform.pushResponse({ status: 200, body: { objectId: 'test-id' } });
      await User.logInWithAuthData('test-platform', {});
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/users');
    });

    it('should set authData to body.authData[platform]', async function () {
      platform.pushResponse({ status: 200, body: { objectId: 'test-id' } });
      await User.logInWithAuthData('test-platform', { key: 'value' });
      const req = platform.popRequest();
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
      (testApp._kvGet(KEY_CURRENT_USER) === undefined).should.true();
    });
  });

  describe('#requestEmailVerify', function () {
    it('should send POST request to /requestEmailVerify', async function () {
      const User = new UserClass(testApp);
      await User.requestEmailVerify('i@example.com');
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/requestEmailVerify');
      req.body.should.eql({ email: 'i@example.com' });
    });
  });

  describe('#requestLoginSmsCode', function () {
    it('should send POST request to /requestEmailVerify', async function () {
      const User = new UserClass(testApp);
      await User.requestLoginSmsCode('123456789');
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/requestLoginSmsCode');
      req.body.should.eql({ mobilePhoneNumber: '123456789' });
    });
  });

  describe('#requestMobilePhoneVerify', function () {
    it('should send POST request to /requestMobilePhoneVerify', async function () {
      const User = new UserClass(testApp);
      await User.requestMobilePhoneVerify('123456789');
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/requestMobilePhoneVerify');
      req.body.should.eql({ mobilePhoneNumber: '123456789' });
    });
  });

  describe('#requestPasswordReset', function () {
    it('should send POST request to /requestPasswordReset', async function () {
      const User = new UserClass(testApp);
      await User.requestPasswordReset('i@example.com');
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/requestPasswordReset');
      req.body.should.eql({ email: 'i@example.com' });
    });
  });

  describe('#requestPasswordResetBySmsCode', function () {
    it('should send POST request to /requestPasswordResetBySmsCode', async function () {
      const User = new UserClass(testApp);
      await User.requestPasswordResetBySmsCode('123456789');
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/requestPasswordResetBySmsCode');
      req.body.should.eql({ mobilePhoneNumber: '123456789' });
    });
  });

  describe('#resetPasswordBySmsCode', function () {
    it('should send PUT request to /resetPasswordBySmsCode/<code>', async function () {
      const User = new UserClass(testApp);
      await User.resetPasswordBySmsCode('123456', 'secret');
      const req = platform.popRequest();
      req.method.should.eql('PUT');
      req.path.should.eql('/1.1/resetPasswordBySmsCode/123456');
      req.body.should.eql({ password: 'secret' });
    });
  });

  describe('#verifyMobilePhone', function () {
    it('should send POST request to /verifyMobilePhone/<code>', async function () {
      const User = new UserClass(testApp);
      await User.verifyMobilePhone('123456');
      const req = platform.popRequest();
      req.method.should.eql('POST');
      req.path.should.eql('/1.1/verifyMobilePhone/123456');
    });
  });
});
