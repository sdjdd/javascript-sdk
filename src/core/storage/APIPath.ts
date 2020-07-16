export class APIPath {
  static get(className: string, objectId: string): string {
    if (className === '_User') {
      return '/1.1/users/' + objectId;
    }
    return '/1.1/classes/' + className + '/' + objectId;
  }
}
