import * as aes from 'aes-js';
import * as argon2 from 'argon2';

export async function encrypt(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await argon2.hash(password, { salt, hashLength: 32 });
  
  const textBytes = aes.utils.utf8.toBytes(text);
  const aesCtr = new aes.ModeOfOperation.ctr(
    aes.utils.hex.toBytes(key.slice(0, 32))
  );
  const encryptedBytes = aesCtr.encrypt(textBytes);
  
  return JSON.stringify({
    salt: Array.from(salt),
    encrypted: Array.from(encryptedBytes)
  });
}

export async function decrypt(encryptedText: string, password: string): Promise<string> {
  const { salt, encrypted } = JSON.parse(encryptedText);
  
  const key = await argon2.hash(password, {
    salt: new Uint8Array(salt),
    hashLength: 32
  });
  
  const aesCtr = new aes.ModeOfOperation.ctr(
    aes.utils.hex.toBytes(key.slice(0, 32))
  );
  const decryptedBytes = aesCtr.decrypt(new Uint8Array(encrypted));
  
  return aes.utils.utf8.fromBytes(decryptedBytes);
}
