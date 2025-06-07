export const hexToBuffer = (hex: string): ArrayBuffer => {
  const matches = hex.match(/.{1,2}/g) || [];
  const bytes = matches.map(byte => parseInt(byte, 16));
  return new Uint8Array(bytes).buffer;
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

    const signatureBuffer = hexToBuffer(signature);
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

  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
