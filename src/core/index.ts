import { Env } from './Env';
import { Platform } from './Platform';

export * from './App';
export * from './Storage';
export * from './Platform';
export * from './ObjectReference';

export function setPlatform(plat: Platform): void {
  Env.setPlatform(plat);
}
