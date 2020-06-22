import { Network } from './Network';

export * from './Network';

export interface Platform {
  name: string;
  network: Network;
}
