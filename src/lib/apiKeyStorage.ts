import SecureStorage from "@/lib/secureStorage";

const STORAGE_KEY = "geminiApiKey";

export async function storeApiKey(key: string | null): Promise<void> {
  try {
    if (key) {
      await SecureStorage.setItem(STORAGE_KEY, key);
    } else {
      SecureStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    console.warn("Falling back to localStorage for API key storage");
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export async function loadApiKey(): Promise<string | null> {
  try {
    const key = await SecureStorage.getItem(STORAGE_KEY);
    if (key) return key;

    // Migrate legacy localStorage key
    const legacyKey = localStorage.getItem(STORAGE_KEY);
    if (legacyKey) {
      await SecureStorage.setItem(STORAGE_KEY, legacyKey);
      localStorage.removeItem(STORAGE_KEY);
      return legacyKey;
    }

    return null;
  } catch {
    return localStorage.getItem(STORAGE_KEY);
  }
}
