/**
 * Secure storage utility for sensitive data like API keys
 * Uses encryption when possible and provides fallback to localStorage
 */

// Simple encryption/decryption using Web Crypto API
class SecureStorage {
  private static readonly STORAGE_KEY_PREFIX = "secure_";
  private static readonly ENCRYPTION_KEY_NAME = "app_encryption_key";

  /**
   * Generate or retrieve encryption key
   */
  private static async getEncryptionKey(): Promise<CryptoKey> {
    // Try to get existing key from IndexedDB or generate new one
    try {
      const keyData = localStorage.getItem(this.ENCRYPTION_KEY_NAME);
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

    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Store key for future use (in production, this should be more secure)
    try {
      const keyBuffer = await crypto.subtle.exportKey("raw", key);
      localStorage.setItem(
        this.ENCRYPTION_KEY_NAME,
        JSON.stringify(Array.from(new Uint8Array(keyBuffer)))
      );
    } catch (error) {
      console.warn("Failed to store encryption key:", error);
    }

    return key;
  }

  /**
   * Encrypt data using AES-GCM
   */
  private static async encrypt(data: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  private static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
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

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Store sensitive data securely
   */
  static async setItem(key: string, value: string): Promise<void> {
    const storageKey = this.STORAGE_KEY_PREFIX + key;

    if (typeof window === "undefined") {
      throw new Error(
        "Secure storage is only available in browser environment"
      );
    }

    try {
      // Try to use encryption if Web Crypto API is available
      if (window.crypto && window.crypto.subtle) {
        const encryptedValue = await this.encrypt(value);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            encrypted: true,
            data: encryptedValue
          })
        );
      } else {
        // Fallback to base64 encoding (not secure, but better than plain text)
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

  /**
   * Retrieve sensitive data securely
   */
  static async getItem(key: string): Promise<string | null> {
    const storageKey = this.STORAGE_KEY_PREFIX + key;

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
        return await this.decrypt(parsed.data);
      } else {
        // Fallback for base64 encoded data
        return atob(parsed.data);
      }
    } catch (error) {
      console.error("Failed to retrieve secure data:", error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  static removeItem(key: string): void {
    const storageKey = this.STORAGE_KEY_PREFIX + key;

    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }

  /**
   * Check if Web Crypto API is available
   */
  static isSecureStorageAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.subtle !== undefined
    );
  }
}

export default SecureStorage;
