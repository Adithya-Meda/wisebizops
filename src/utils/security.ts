import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // Must be 256 bits (32 bytes)
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Scrubs PII (Personally Identifiable Information) and common secrets from a string.
 */
export function scrubPII(text: string): string {
  if (!text) return text;
  
  let scrubbed = text;
  
  // 1. Scrub IPv4 and IPv6
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b|(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/gi;
  scrubbed = scrubbed.replace(ipRegex, '[REDACTED_IP]');

  // 2. Scrub Emails
  const emailRegex = /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g;
  scrubbed = scrubbed.replace(emailRegex, '[REDACTED_EMAIL]');

  // 3. Scrub MAC Addresses
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/g;
  scrubbed = scrubbed.replace(macRegex, '[REDACTED_MAC]');

  // 4. Scrub common secrets/tokens (basic heuristics)
  const tokenRegex = /(Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*)|(password\s*=\s*[^\s]+)|(AKIA[0-9A-Z]{16})/gi;
  scrubbed = scrubbed.replace(tokenRegex, '[REDACTED_SECRET]');

  return scrubbed;
}

/**
 * Encrypts a string using AES-256-GCM.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32); // Ensure it's exactly 32 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string using AES-256-GCM.
 */
export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const authTag = Buffer.from(textParts[1], 'hex');
  const encryptedText = Buffer.from(textParts[2], 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
