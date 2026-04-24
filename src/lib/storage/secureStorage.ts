/**
 * Secure storage utility for sensitive data like API keys.
 * Uses encryption when possible and provides fallback to localStorage.
 */

const STORAGE_KEY_PREFIX = "secure_";
const ENCRYPTION_KEY_NAME = "app_encryption_key";

async function getEncryptionKey(): Promise<CryptoKey> {
  try {
    const keyData = localStorage.getItem(ENCRYPTION_KEY_NAME);
    if (keyData) {
      const keyBuffer = new Uint8Array(JSON.parse(keyData));
      return await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );
    }
  } catch (error) {
    console.warn("Failed to retrieve existing encryption key:", error);
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  try {
    const keyBuffer = await crypto.subtle.exportKey("raw", key);
    localStorage.setItem(
      ENCRYPTION_KEY_NAME,
      JSON.stringify(Array.from(new Uint8Array(keyBuffer)))
    );
  } catch (error) {
    console.warn("Failed to store encryption key:", error);
  }

  return key;
}

async function encrypt(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      dataBuffer
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

async function setItem(key: string, value: string): Promise<void> {
  const storageKey = STORAGE_KEY_PREFIX + key;

  if (typeof window === "undefined") {
    throw new Error("Secure storage is only available in browser environment");
  }

  try {
    if (window.crypto?.subtle) {
      const encryptedValue = await encrypt(value);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          encrypted: true,
          data: encryptedValue
        })
      );
    } else {
      console.warn("Web Crypto API not available, using base64 encoding");
      const encodedValue = btoa(value);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          encrypted: false,
          data: encodedValue
        })
      );
    }
  } catch (error) {
    console.error("Failed to store secure data:", error);
    throw new Error("Failed to store sensitive data");
  }
}

async function getItem(key: string): Promise<string | null> {
  const storageKey = STORAGE_KEY_PREFIX + key;

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) {
      return null;
    }

    const parsed = JSON.parse(storedData);

    if (parsed.encrypted) {
      return await decrypt(parsed.data);
    }

    return atob(parsed.data);
  } catch (error) {
    console.error("Failed to retrieve secure data:", error);
    return null;
  }
}

function removeItem(key: string): void {
  const storageKey = STORAGE_KEY_PREFIX + key;

  if (typeof window !== "undefined") {
    localStorage.removeItem(storageKey);
  }
}

function isSecureStorageAvailable(): boolean {
  return typeof window !== "undefined" && window.crypto?.subtle !== undefined;
}

const SecureStorage = {
  setItem,
  getItem,
  removeItem,
  isSecureStorageAvailable
};

export default SecureStorage;
