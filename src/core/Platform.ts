import { IPlatform } from '../adapters';

export class PlatformSupport {
  private static platform: IPlatform;

  static setPlatform(platform: IPlatform): void {
    if (PlatformSupport.platform) {
      throw new Error('platform already defined');
    }
    PlatformSupport.platform = platform;
  }

  static getPlatform(): IPlatform {
    if (!PlatformSupport.platform) {
      throw new Error('platform not set');
    }
    return PlatformSupport.platform;
  }
}
