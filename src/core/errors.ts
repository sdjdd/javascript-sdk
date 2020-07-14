export class UluruError extends Error {
  constructor(public code: number, public error: string) {
    super(`code: ${code}, message: ${error}`);
  }
}
