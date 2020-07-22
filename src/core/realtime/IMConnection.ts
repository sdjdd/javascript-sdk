import { EventEmitter } from 'eventemitter3';
import { log } from '../utils';
import { PlatformSupport } from '../Platform';
import { IPlatform } from '../../adapters';
import { App } from '../App';
import { PushRouter } from '../push/PushRouter';

const RETRY_COUNT = 10;
const RETRY_TIMEOUT = 100; // ms
const MAX_RETRY_TIMEOUT = 30 * 1000;
const HEARTBEAT_PERIOD = 1000 * 180;
const DEFAULT_PROTOCOL = 'lc.json.3';

export class IMConnection extends EventEmitter<'open' | 'message' | 'error'> {
  private app: App;
  private protocol: string;
  private socket: WebSocket;
  private encoder: (data: string | ArrayBuffer) => string | ArrayBuffer;
  private decoder: (data: string | ArrayBuffer) => string | ArrayBuffer;
  private retryCount = RETRY_COUNT;
  private retryTimeout = RETRY_TIMEOUT;
  private retryTimer: ReturnType<typeof setTimeout>;
  private sendBuffer: Array<string | ArrayBuffer> = [];
  private platform: IPlatform;
  private heartbeatTimer: ReturnType<typeof setInterval>;
  private _nextIndex = 1;

  constructor(app: App, protocol?: string) {
    super();
    this.app = app;
    this.protocol = protocol ?? DEFAULT_PROTOCOL;
    this.platform = PlatformSupport.getPlatform();
    this.connect();
  }

  get nextIndex(): number {
    return this._nextIndex++;
  }

  private async connect(useRouterCache = true): Promise<void> {
    if (this.socket) {
      this.socket.close();
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    const router = await PushRouter.get(this.app, useRouterCache);
    const urls = [router.server, router.secondary];
    this.socket = this.platform.connect(urls[0], this.protocol);
    log('LC:IM:connect', 'url = %s, protocol = %s', urls[0], this.protocol);

    const reconnect = () => {
      log('LC:IM:close', 'try to reconnect');
      this.retryCount--;
      if (this.retryCount < 0) {
        throw new Error('Cannot reconnect: too many retries');
      }
      this.retryTimer = setTimeout(() => this.connect(), this.retryTimeout);
      this.retryTimeout *= 2;
      if (this.retryTimeout > MAX_RETRY_TIMEOUT) {
        this.retryTimeout = MAX_RETRY_TIMEOUT;
      }
    };

    this.socket.onopen = () => {
      log('LC:IM:connected', 'connection established');
      this.retryCount = RETRY_COUNT;
      this.retryTimeout = RETRY_TIMEOUT;
      this.flush();
      this.emit('open');

      if (!this.heartbeatTimer) {
        this.heartbeatTimer = setInterval(
          this.heartbeat.bind(this),
          HEARTBEAT_PERIOD
        );
      }
    };

    this.socket.onmessage = ({ data }) => {
      if (this.decoder) {
        data = this.decoder(data);
      }
      if (data === '{}') {
        log('LC:IM:heartbeat', 'pong');
        return;
      }
      log('LC:IM:recv', data);
      this.emit('message', this.decoder ? this.decoder(data) : data);
    };

    this.socket.onerror = (event) => {
      // log('LC:IM:error', event);
      if (
        this.socket.readyState === this.socket.CLOSED ||
        this.socket.readyState === this.socket.CLOSING
      ) {
        reconnect();
      }
      this.emit('error', event);
    };
  }

  isOpen(): boolean {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      return true;
    }
    return false;
  }

  private flush(): void {
    if (!this.socket || this.socket.readyState !== this.socket.OPEN) {
      return;
    }
    while (this.sendBuffer.length > 0) {
      const data = this.sendBuffer.shift();
      this.socket.send(this.encoder ? this.encoder(data) : data);
    }
  }

  heartbeat(): void {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      log('LC:IM:heartbeat', 'ping');
      this.socket.send('{}');
    }
  }

  send(data: string | ArrayBuffer): void {
    log('LC:IM:send', data);
    this.sendBuffer.push(data);
    this.flush();
  }

  close(): void {
    this.socket.close();
  }
}
