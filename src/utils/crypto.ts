/**
 * Note: We implement our own signature validation for Cloudflare Workers compatibility.
 * The @line/bot-sdk's validateSignature uses Node.js crypto module which is not available
 * in Cloudflare Workers. This implementation uses Web Crypto API instead.
 * 
 * LINE sends signatures in base64 format, so we handle base64 encoding/decoding here.
 */

export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const verifySignature = async (
  body: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // LINE sends signatures in base64 format
    const signatureBuffer = base64ToBuffer(signature);
    const dataBuffer = encoder.encode(body);

    return crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
  } catch {
    return false;
  }
};

export const generateTestSignature = async (body: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const dataBuffer = encoder.encode(body);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataBuffer);

  // Return base64 signature to match LINE's format
  return bufferToBase64(signatureBuffer);
};