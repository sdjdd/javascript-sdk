import { App } from '../App';
import { LCObject } from './Object';
import { IObjectData } from '../types';
import { HTTPRequest } from '../utils';
import { Class } from './Class';

export interface BatchResultSuccess {
  objectId: string;
  updatedAt: string;
}

export interface BatchResultError {
  code: number;
  error: string;
}

export interface BatchResult {
  success?: BatchResultSuccess;
  error?: BatchResultError;
}

export class Batch {
  private _requests: HTTPRequest[] = [];

  constructor(public app: App) {}

  add(clazz: Class, data: IObjectData): Promise<LCObject> {
    return null;
  }
}
