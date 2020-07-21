import { EventEmitter } from 'eventemitter3';
import { log } from './utils';
import { PlatformSupport } from './Platform';
import { IPlatform } from '../adapters';

const RETRY_COUNT = 10;
const RETRY_TIMEOUT = 100; // ms
const HEARTBEAT_PERIOD = 1000 * 180;

export class Connection extends EventEmitter<'open' | 'message' | 'error'> {
  private url: string;
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

  constructor() {
    super();
    this.platform = PlatformSupport.getPlatform();
  }

  connect(url: string, protocol?: string): void {
    if (this.socket) {
      if (
        this.socket.readyState === this.socket.OPEN ||
        this.socket.readyState === this.socket.CONNECTING
      ) {
        if (this.url === url) return;
        this.socket.onclose = null;
        this.socket.close();
      }
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
      }
    }

    this.url = url;
    this.protocol = protocol;
    this.socket = this.platform.connect(url, protocol);

    const reconnect = () => {
      log('LC:Connection:close', 'try to reconnect');
      this.retryCount--;
      if (this.retryCount < 0) {
        throw new Error('Cannot reconnect: too many retries');
      }
      this.retryTimer = setTimeout(
        () => this.connect(this.url, this.protocol),
        this.retryTimeout
      );
      this.retryTimeout *= 2;
    };

    this.socket.onopen = () => {
      log('LC:Connection:connected', 'connection established');
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
      if (data === '{}') {
        log('LC:Connection:heartbeat', 'pong');
        return;
      }
      log('LC:Connection:recv', data);
      this.emit('message', this.decoder ? this.decoder(data) : data);
    };

    this.socket.onerror = (event) => {
      // log('LC:Connection:error', event);
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
      log('LC:Connection:heartbeat', 'ping');
      this.socket.send('{}');
    }
  }

  send(data: string | ArrayBuffer): void {
    log('LC:Connection:send', data);
    this.sendBuffer.push(data);
    this.flush();
  }

  close(): void {
    if (this.socket && this.socket.readyState !== this.socket.CLOSED) {
      this.socket.close();
    }
  }
}
