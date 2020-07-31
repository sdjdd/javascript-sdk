import * as browserAdapters from '@leancloud/platform-adapters-browser';
import { Adapters } from '../core';

Adapters.set(browserAdapters);

export * from '../core';
