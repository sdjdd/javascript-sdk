import { EventEmitter } from 'eventemitter3';
import { log } from './utils';
import { PlatformSupport } from './Platform';
import { IPlatform } from '../adapters';

const RETRY_COUNT = 10;
const RETRY_TIMEOUT = 100; // ms

export class Connection extends EventEmitter<'open' | 'message' | 'error'> {
  private url: string;
  private protocol: string;
  private socket: WebSocket;
  private encoder: (data: string | ArrayBuffer) => string | ArrayBuffer;
  private decoder: (data: string | ArrayBuffer) => string | ArrayBuffer;
  private retryCount = RETRY_COUNT;
  private retryTimeout = RETRY_TIMEOUT;
  private retryTimerID: number;
  private sendBuffer: Array<string | ArrayBuffer> = [];
  private platform: IPlatform;
  private shutdown = false;

  constructor() {
    super();
    this.platform = PlatformSupport.getPlatform();
  }

  connect(url: string, protocol?: string): void {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      if (this.url === url) return;
      this.socket.onclose = null;
      this.socket.close();
      clearTimeout(this.retryTimerID);
    }

    this.url = url;
    this.protocol = protocol;
    this.socket = this.platform.connect(url, protocol);

    const reconnect = () => {
      if (this.shutdown) return;
      log('LC:Connection:close', 'try to reconnect');
      this.retryCount--;
      if (this.retryCount < 0) {
        throw new Error('Cannot reconnect: too many retries');
      }
      this.retryTimerID = setTimeout(
        () => this.connect(this.url, this.protocol),
        this.retryTimeout
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      this.retryTimeout *= 2;
    };

    this.socket.onopen = () => {
      log('LC:Connection:connected', 'connection established');
      this.retryCount = RETRY_COUNT;
      this.retryTimeout = RETRY_TIMEOUT;

      this.socket.onmessage = ({ data }) => {
        log('LC:Connection:recv', data);
        this.emit('message', this.decoder ? this.decoder(data) : data);
      };

      this.flush();
      this.emit('open');
    };

    this.socket.onerror = (event) => {
      log('LC:Connection:error', event);
      this.emit('error', event);
      if (this.socket.readyState === this.socket.CLOSED) {
        reconnect();
      }
    };
  }

  isOpen(): boolean {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      return true;
    }
    return false;
  }

  private flush(): void {
    if (this.socket && this.socket.readyState === this.socket.OPEN) {
      while (this.sendBuffer.length > 0) {
        const data = this.sendBuffer.shift();
        if (this.encoder) {
          this.socket.send(this.encoder(data));
        } else {
          this.socket.send(data);
        }
      }
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
