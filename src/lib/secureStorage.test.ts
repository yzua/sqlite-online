import { beforeEach, describe, expect, it, vi } from "vitest";
import SecureStorage from "./secureStorage";

describe("SecureStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("stores and retrieves encrypted values when Web Crypto is available", async () => {
    await SecureStorage.setItem("geminiApiKey", "secret-value");

    const storedValue = localStorage.getItem("secure_geminiApiKey");

    expect(storedValue).toContain('"encrypted":true');
    await expect(SecureStorage.getItem("geminiApiKey")).resolves.toBe(
      "secret-value"
    );
  });

  it("falls back to base64 storage when subtle crypto is unavailable", async () => {
    const originalCrypto = window.crypto;
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: {
        getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto)
      }
    });

    try {
      await SecureStorage.setItem("geminiApiKey", "fallback-value");

      expect(localStorage.getItem("secure_geminiApiKey")).toContain(
        '"encrypted":false'
      );
      await expect(SecureStorage.getItem("geminiApiKey")).resolves.toBe(
        "fallback-value"
      );
    } finally {
      Object.defineProperty(window, "crypto", {
        configurable: true,
        value: originalCrypto
      });
    }
  });

  it("returns null instead of throwing for corrupted stored data", async () => {
    localStorage.setItem(
      "secure_geminiApiKey",
      JSON.stringify({ encrypted: true, data: "not-valid-base64" })
    );

    await expect(SecureStorage.getItem("geminiApiKey")).resolves.toBeNull();
  });

  it("removes items and reports availability based on subtle crypto support", () => {
    localStorage.setItem("secure_geminiApiKey", "value");

    SecureStorage.removeItem("geminiApiKey");

    expect(localStorage.getItem("secure_geminiApiKey")).toBeNull();
    expect(SecureStorage.isSecureStorageAvailable()).toBe(true);
  });
});
