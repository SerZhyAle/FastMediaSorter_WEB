// Stack smoke test (ticket S0003). Static ES module, no build step: the browser executing this
// file proves module loading; the checks prove the WebCrypto primitives the first release is
// built from. Key material is never written to the console - only check names and the verdict.

const declaredChecks = 6;
const results = document.getElementById('results');
const lines = [];
let failures = 0;
let executed = 0;

function report(text) {
  lines.push(text);
  console.info(text);
}

async function check(name, run) {
  executed += 1;
  try {
    await run();
    report(`ok ${name}`);
  } catch (error) {
    failures += 1;
    report(`FAIL ${name}: ${error && error.message ? error.message : error}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (got ${actual}, expected ${expected})`);
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function run() {
  await check('crypto.subtle is present', () => {
    assert(crypto && crypto.subtle, 'WebCrypto SubtleCrypto is unavailable on this origin');
  });

  await check('SHA-256 one-shot digest matches the RFC 6234 vector', () => {
    // Vector: SHA-256("abc"), FIPS 180-4 example.
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode('abc')).then((digest) => {
      assertEqual(
        toHex(digest),
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        'digest mismatch',
      );
    });
  });

  const shared = new Uint8Array(32);
  await check('ECDH P-256 key pairs derive the same shared secret both ways', () => {
    const params = { name: 'ECDH', namedCurve: 'P-256' };
    const ours = crypto.subtle.generateKey(params, false, ['deriveBits']);
    const theirs = crypto.subtle.generateKey(params, false, ['deriveBits']);
    return Promise.all([ours, theirs]).then(([a, b]) =>
      Promise.all([
        crypto.subtle.deriveBits({ name: 'ECDH', public: b.publicKey }, a.privateKey, 256),
        crypto.subtle.deriveBits({ name: 'ECDH', public: a.publicKey }, b.privateKey, 256),
      ]).then(([ab, ba]) => {
        assertEqual(toHex(ab), toHex(ba), 'the two directions disagree');
        assert(ab.byteLength === 32, 'the shared secret is not 256 bits');
        shared.set(new Uint8Array(ab));
      }),
    );
  });

  await check('HKDF (SHA-256) derives key material from the shared secret', () => {
    return crypto.subtle
      .importKey('raw', shared, 'HKDF', false, ['deriveBits'])
      .then((hkdfKey) =>
        crypto.subtle.deriveBits(
          {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new TextEncoder().encode('FMS_Web smoke salt'),
            info: new TextEncoder().encode('FMS_Web smoke info'),
          },
          hkdfKey,
          256,
        ),
      )
      .then((derived) => {
        assert(derived.byteLength === 32, 'HKDF produced the wrong length');
        assert(toHex(derived) !== toHex(shared), 'HKDF output equals its input');
      });
  });

  await check('HMAC (SHA-256) signs and verifies with a non-extractable key', () => {
    return crypto.subtle
      .importKey('raw', shared, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
      .then((hmacKey) => {
        const message = new TextEncoder().encode('FMS_Web smoke message');
        return crypto.subtle.sign('HMAC', hmacKey, message).then((mac) =>
          crypto.subtle.verify('HMAC', hmacKey, mac, message).then((verified) => {
            assert(verified, 'HMAC verify failed');
          }),
        );
      });
  });

  await check('AES-GCM seals and opens with a non-extractable key', () => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle
      .importKey('raw', shared, 'AES-GCM', false, ['encrypt', 'decrypt'])
      .then((aesKey) => {
        const plaintext = new TextEncoder().encode('FMS_Web smoke plaintext');
        return crypto.subtle
          .encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext)
          .then((sealed) =>
            crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, sealed).then((opened) => {
              assertEqual(
                new TextDecoder().decode(opened),
                'FMS_Web smoke plaintext',
                'AES-GCM round trip changed the plaintext',
              );
            }),
          );
      });
  });

  const passed = failures === 0 && executed === declaredChecks;
  const verdict = passed
    ? `SMOKE: PASS (${executed} checks)`
    : `SMOKE: FAIL (${failures} failed, ${executed} of ${declaredChecks} executed)`;
  results.className = passed ? 'pass' : 'fail';
  results.textContent = [...lines, verdict].join('\n');
  if (passed) {
    console.info(verdict);
  } else {
    console.error(verdict);
  }
}

run().catch((error) => {
  failures += 1;
  results.className = 'fail';
  results.textContent = [...lines, `FAIL unhandled: ${error}`, 'SMOKE: FAIL'].join('\n');
  console.error(`SMOKE: FAIL (${error})`);
});
