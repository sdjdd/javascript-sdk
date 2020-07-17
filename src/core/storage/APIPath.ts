export class APIPath {
  static get(className: string, objectId?: string): string {
    let path = '/1.1';
    if (className === '_User') {
      path += '/users';
    } else {
      path += '/classes/' + className;
    }
    if (objectId) {
      path += '/' + objectId;
    }
    return path;
  }
}
