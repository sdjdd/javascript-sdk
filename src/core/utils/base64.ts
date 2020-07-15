const dictStr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const dict = new Uint8Array(256);

for (let i = 0; i < dictStr.length; i++) {
  dict[dictStr.charCodeAt(i)] = i;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let bufLen = (base64.length / 4) * 3;

  if (base64[base64.length - 1] === '=') {
    bufLen--;
    if (base64[base64.length - 2] === '=') {
      bufLen--;
    }
  }

  const arrayBuffer = new ArrayBuffer(bufLen);
  const bytes = new Uint8Array(arrayBuffer);

  let idx = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const ch1 = dict[base64.charCodeAt(i)];
    const ch2 = dict[base64.charCodeAt(i + 1)];
    const ch3 = dict[base64.charCodeAt(i + 2)];
    const ch4 = dict[base64.charCodeAt(i + 3)];

    bytes[idx++] = (ch1 << 2) | (ch2 >> 4);
    bytes[idx++] = ((ch2 & 0xf) << 4) | (ch3 >> 2);
    bytes[idx++] = ((ch3 & 3) << 6) | (ch4 & 0x3f);
  }
  return arrayBuffer;
}
