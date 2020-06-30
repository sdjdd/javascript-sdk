import { App } from '../src/core/';
import { HTTPRequest } from '../src/core/http';

export class TestApp extends App {
  requests: HTTPRequest[] = [];

  async _doRequest(req: HTTPRequest): Promise<Record<string, unknown>> {
    this.requests.push(req);
    return { status: 'request recorded' };
  }

  reset(): void {
    this.requests.splice(0, this.requests.length);
  }

  popRequestBody(): Record<string, unknown> {
    return this.requests.pop().body as Record<string, unknown>;
  }
}
