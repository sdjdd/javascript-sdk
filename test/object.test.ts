import 'should';
import AV from '../src/av';
import * as env from '../env';

describe('AV.Object', function () {
  const app = new AV.App({
    appId: env.appId,
    appKey: env.appKey,
    serverURL: env.serverURL,
  });
  app.id.should.eql(env.appId);
  app.key.should.eql(env.appKey);
  app.serverURL.should.eql(env.serverURL);

  it('should create an object', async function () {
    let obj = app.object('Test').create();
    obj.set('content', 'bar');
    await obj.save();

    obj = await app.object('Test').fetch(obj.id);
    obj.get('content').should.eql('bar');
  });
});
