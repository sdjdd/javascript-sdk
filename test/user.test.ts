import 'should';
import {
  setGlobalTestPlatform,
  globalTestPlatform as platform,
} from './TestPlatform';
import { App, User, UserClass } from '../src/core';

setGlobalTestPlatform();

const testApp = new App({
  appId: 'test-app-id',
  appKey: 'test-app-key',
  serverURL: 'test-server-url',
});

describe('User', function () {
  describe('#isAnonymous', function () {
    const user = new User('test-id');

    it('should return false when #data is undefined', function () {
      user.data = void 0;
      user.isAnonymous().should.false();
    });

    it('should return false when #data.authData is undefined', function () {
      user.data = {};
      user.isAnonymous().should.false();
    });

    it('should return false when #data.authData.anonymous is undefined', function () {
      user.data = { authData: {} };
      user.isAnonymous().should.false();
    });

    it('should return true when #data.authData.anonymous is not undefined', function () {
      user.data = { authData: { anonymous: 'anonymous-id' } };
      user.isAnonymous().should.true();
    });
  });

  describe('#isAuthenticated', function () {
    const user = new User('test-user-id', testApp);
    user.data = { sessionToken: 'test-session' };

    it('should send GET request to /users/me', async function () {
      await user.isAuthenticated();
      const req = platform.popRequest();
      req.method.should.eql('GET');
      req.path.should.eql('/1.1/users/me');
      req.header['X-LC-Session'].should.eql('test-session');
    });

    it('should return true when uluru response ok', async function () {
      platform.pushResponse({ status: 200 });
      (await user.isAuthenticated()).should.true();
    });

    it('should return false when uluru response error 211', async function () {
      platform.pushResponse({ status: 400, body: { code: 211, error: '' } });
      (await user.isAuthenticated()).should.false();
    });

    it('should throw when catch an unknown error', function () {
      platform.pushError(new Error('some error message'));
      return user.isAuthenticated().should.rejected();
    });
  });

  describe('#updatePassword', function () {
    const user = new User('test-user-id', testApp);
    user.data = { sessionToken: 'test-session' };

    it('should send PUT request to /users/<user-id>/updatePassword', async function () {
      await user.updatePassword('old-password', 'new-password');
      const req = platform.popRequest();
      req.method.should.eql('PUT');
      req.path.should.eql('/1.1/users/test-user-id/updatePassword');
      req.body.should.eql({
        old_password: 'old-password',
        new_password: 'new-password',
      });
    });

    it('should update #sessionToken', async function () {
      user.data.sessionToken = 'to-be-replaced';
      platform.pushResponse({
        status: 200,
        body: { sessionToken: 'new-session' },
      });
      await user.updatePassword('old-password', 'new-password');
      user.sessionToken.should.eql('new-session');
    });

    it('should not update sessionToken of App when currentUser is not this', async function () {
      const currentUser = new User('test-current-user-id', testApp);
      currentUser.data = { sessionToken: 'test-current-session' };
      UserClass._setCurrentUser(testApp, currentUser);
      platform.pushResponse({
        status: 200,
        body: { sessionToken: 'new-session' },
      });
      await user.updatePassword('old-password', 'new-password');
      UserClass._getCurrentUser(testApp).sessionToken.should.eql(
        'test-current-session'
      );
      testApp.getSessionToken().should.eql('test-current-session');
    });

    it('should update sessionToken of App when currentUser is this', async function () {
      user.data = { sessionToken: 'test-current-session' };
      UserClass._setCurrentUser(testApp, user);
      platform.pushResponse({
        status: 200,
        body: { sessionToken: 'new-session' },
      });
      await user.updatePassword('old-password', 'new-password');
      UserClass._getCurrentUser(testApp).sessionToken.should.eql('new-session');
      testApp.getSessionToken().should.eql('new-session');
    });
  });
});
