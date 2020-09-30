import { Adapters } from '@leancloud/adapter-types';
import { AdapterManager } from './adapters';
import { Logger } from './log';

export interface Plugin {
  install(app: typeof PluginManager): void;
}

export function use(plugin: Plugin): void {
  plugin.install(PluginManager);
}

export class PluginManager {
  static plugins: Record<string, unknown> = {};

  private static _adaptersPromise: Promise<Partial<Adapters>>;
  private static _adaptersRecevier: (adapters: Adapters) => void;

  static register(id: string, plugin: unknown): void {
    Logger.log('LC:Plugin:register', id);
    this.plugins[id] = plugin;
  }

  static requestAdapters(): Promise<Partial<Adapters>> {
    if (AdapterManager.isSet) {
      return Promise.resolve(AdapterManager.get());
    }

    if (!this._adaptersPromise) {
      this._adaptersPromise = new Promise((resolve) => {
        this._adaptersRecevier = resolve;
      });
      AdapterManager.on('set', this._adaptersRecevier);
    }

    return this._adaptersPromise;
  }

  static getLogger(): typeof Logger {
    return Logger;
  }
}