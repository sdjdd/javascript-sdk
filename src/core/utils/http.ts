export function httpStatusNotOK(status: number): boolean {
  return !/^2/.test(status.toString());
}
