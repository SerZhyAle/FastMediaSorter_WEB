// The envelope frame of DEVICE-EXCHANGE 7.1 as one WebSocket binary message (WEB-BINDING
// `websocket-binding`): a 4-byte unsigned big-endian length, then that many bytes of one UTF-8 JSON
// object. Item T bounds the body: 16384 bytes until the stream is authenticated, 262144 after.

export const schemaVersion = 2;
export const frameLimitOpen = 16384;
export const frameLimitAuthenticated = 262144;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export class FrameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FrameError';
  }
}

// An envelope is written with `schemaVersion` and `type` first, then its members in the order given,
// which is the order of the contract's transcripts.
export function envelope(type, members = {}) {
  return { schemaVersion, type, ...members };
}

export function encodeFrame(message, limit = frameLimitOpen) {
  const body = encoder.encode(JSON.stringify(message));
  if (body.length === 0 || body.length > limit) throw new FrameError(`frame body of ${body.length} bytes is outside 1..${limit}`);
  const frame = new Uint8Array(4 + body.length);
  new DataView(frame.buffer).setUint32(0, body.length, false);
  frame.set(body, 4);
  return frame;
}

// One message is exactly one frame: the length word equals the message length minus 4.
export function decodeFrame(data, limit = frameLimitAuthenticated) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length < 5) throw new FrameError(`message of ${bytes.length} bytes holds no frame`);
  const length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, false);
  if (length !== bytes.length - 4) throw new FrameError(`length word ${length} does not match the message`);
  if (length > limit) throw new FrameError(`frame body of ${length} bytes is above ${limit}`);
  let value;
  try {
    value = JSON.parse(decoder.decode(bytes.subarray(4)));
  } catch (error) {
    throw new FrameError(`frame body is not JSON (${error && error.name})`);
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new FrameError('frame body is not one object');
  return value;
}
