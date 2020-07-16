import { IObject } from '../types';

export type CreateObjectHandler = (objectId: string) => IObject;

export type CreateDefaultHandler = (
  className: string,
  objectId: string
) => IObject;

export class ObjectFactory {
  private static createHandlers: Record<string, CreateObjectHandler> = {};

  private static createDefaultHandler: CreateDefaultHandler;

  static registerHandler(className: string, h: CreateObjectHandler): void {
    ObjectFactory.createHandlers[className] = h;
  }

  static registerDefaultHandler(h: CreateDefaultHandler): void {
    ObjectFactory.createDefaultHandler = h;
  }

  static create(className: string, objectId: string): IObject {
    const handler = ObjectFactory.createHandlers[className];
    if (handler) {
      return handler(objectId);
    }
    if (!ObjectFactory.createDefaultHandler) {
      throw new Error('No handler for class ' + className);
    }
    return ObjectFactory.createDefaultHandler(className, objectId);
  }
}
