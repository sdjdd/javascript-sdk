import { App } from './app';
import { Platform } from './Platform';

export class Env {
  private static defaultApp: App = null;
  private static platform: Platform = null;

  static setDefaultApp(app: App): void {
    if (Env.defaultApp !== null) {
      throw new Error('default app already defined');
    }
    Env.defaultApp = app;
  }
  static getDefaultApp(): App {
    if (Env.defaultApp === null) {
      throw new Error('default app not define');
    }
    return Env.defaultApp;
  }

  static setPlatform(plat: Platform): void {
    if (Env.platform !== null) {
      throw new Error('Platform already defined');
    }
    Env.platform = plat;
  }
  static getPlatform(): Platform {
    if (Env.platform === null) {
      throw new Error('Platform not define');
    }
    return Env.platform;
  }
}
