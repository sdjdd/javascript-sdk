// import debug from 'debug';

const loggers: Record<string, (...args: unknown[]) => void> = {};

export function log(tag: string, ...args: unknown[]): void {
  // let logger = loggers[tag];
  // if (logger === undefined) {
  //   logger = debug(tag);
  //   loggers[tag] = logger;
  // }
  // logger(...args);
}
