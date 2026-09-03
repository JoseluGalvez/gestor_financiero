const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

export interface EncryptedData {
  iv: string;
  ciphertext: string;
  salt: string;
  algorithm: "AES-GCM";
  keyDerivation: "PBKDF2";
  iterations: number;
}

export interface CryptoResult {
  success: boolean;
  data?: EncryptedData | string;
  error?: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: string, password: string): Promise<CryptoResult> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBuffer
    );
    const result = {
      iv: arrayBufferToBase64(iv.buffer),
      ciphertext: arrayBufferToBase64(ciphertext),
      salt: arrayBufferToBase64(salt.buffer),
      algorithm: "AES-GCM" as const,
      keyDerivation: "PBKDF2" as const,
      iterations: 100000,
    };
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error de cifrado desconocido" };
  }
}

export async function decryptData(encryptedData: { iv: string; ciphertext: string; salt: string }, password: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(encryptedData.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    const decoder = new TextDecoder();
    const data = decoder.decode(decrypted);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error de descifrado (¿contraseña incorrecta?)" };
  }
}

export async function encryptPortfolioData(data: unknown, password: string): Promise<{ success: boolean; data?: { iv: string; ciphertext: string; salt: string }; error?: string }> {
  const json = JSON.stringify(data);
  const result = await encryptData(json, password);
  return result;
}

export async function decryptPortfolioData(encryptedData: { iv: string; ciphertext: string; salt: string }, password: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const result = await decryptData(encryptedData, password);
  if (!result.success || !result.data) return result;
  try {
    const parsed = JSON.parse(result.data);
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: "Datos descifrados corruptos" };
  }
}

export function generateRandomPassword(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  return crypto.subtle.digest("SHA-256", data).then((hash) => {
    const bytes = new Uint8Array(hash);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  });
}

export function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return hashPassword(password).then((h) => h === hash);
}

export function isWebCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}