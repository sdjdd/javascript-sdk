import 'should';
import AV from '../src/av';
import * as env from '../env';
import { AVObject } from '../src/storage/object';

describe('AV.App', function () {
  const app = new AV.App({
    appId: env.appId,
    appKey: env.appKey,
    serverURL: env.serverURL,
  });
  app.id.should.eql(env.appId);
  app.key.should.eql(env.appKey);
  app.serverURL.should.eql(env.serverURL);

  it('should create an object', function () {
    const obj = app.object('Test').create();
    obj.should.instanceOf(AVObject);
    obj.className.should.eql('Test');
  });
});
