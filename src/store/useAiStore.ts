import { create } from "zustand";
import { loadApiKey, storeApiKey } from "@/lib/ai/apiKeyStorage";

interface AiState {
  geminiApiKey: string | null;
  isAiLoading: boolean;
}

interface AiActions {
  setGeminiApiKey: (key: string | null) => Promise<void>;
  setIsAiLoading: (loading: boolean) => void;
  initializeApiKey: () => Promise<void>;
}

type AiStore = AiState & AiActions;

export const useAiStore = create<AiStore>((set) => ({
  geminiApiKey: null,
  isAiLoading: false,

  setGeminiApiKey: async (key) => {
    set({ geminiApiKey: key });
    await storeApiKey(key);
  },
  setIsAiLoading: (loading) => set({ isAiLoading: loading }),
  initializeApiKey: async () => {
    const key = await loadApiKey();
    set({ geminiApiKey: key });
  }
}));
