import { ObjectReference } from '../storage';
import { API } from '../app/API';

export class User extends ObjectReference {
  sessionToken: string;

  constructor(api: API, objectId: string) {
    super(api, '_User', objectId);
  }
}
