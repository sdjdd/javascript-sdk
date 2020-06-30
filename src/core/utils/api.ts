const API_VERSION = '1.1';

export function getClassPath(className: string): string {
  if (className === '_User') {
    return `/${API_VERSION}/users`;
  }
  return `/${API_VERSION}/classes/${className}`;
}
