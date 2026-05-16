import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { isAiPrompt, requestGeminiSql } from "@/lib/ai/gemini";
import { useAiStore } from "@/store/useAiStore";
import { useDatabaseStore } from "@/store/useDatabaseStore";

export function useGeminiAI() {
  const { geminiApiKey, isAiLoading } = useAiStore(
    useShallow((state) => ({
      geminiApiKey: state.geminiApiKey,
      isAiLoading: state.isAiLoading
    }))
  );
  const { tablesSchema, customQuery } = useDatabaseStore(
    useShallow((state) => ({
      tablesSchema: state.tablesSchema,
      customQuery: state.customQuery
    }))
  );
  const setCustomQuery = useDatabaseStore((state) => state.setCustomQuery);
  const setErrorMessage = useDatabaseStore((state) => state.setErrorMessage);
  const setIsAiLoading = useAiStore((state) => state.setIsAiLoading);

  const generateSqlQuery = useCallback(async () => {
    if (!geminiApiKey) {
      setErrorMessage("Gemini API key not set.");
      return;
    }

    if (!isAiPrompt(customQuery)) {
      return;
    }

    setIsAiLoading(true);
    setErrorMessage(null);

    try {
      const sqlQuery = await requestGeminiSql(
        geminiApiKey,
        customQuery,
        tablesSchema
      );
      setCustomQuery(sqlQuery);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setErrorMessage("Error calling Gemini API.");
    } finally {
      setIsAiLoading(false);
    }
  }, [
    geminiApiKey,
    customQuery,
    tablesSchema,
    setCustomQuery,
    setErrorMessage,
    setIsAiLoading
  ]);

  return { generateSqlQuery, isAiLoading };
}
