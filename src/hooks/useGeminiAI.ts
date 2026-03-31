import { useCallback } from "react";
import { isAiPrompt, requestGeminiSql } from "@/lib/gemini";
import { useDatabaseStore } from "@/store/useDatabaseStore";

export function useGeminiAI() {
  const geminiApiKey = useDatabaseStore((state) => state.geminiApiKey);
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);
  const customQuery = useDatabaseStore((state) => state.customQuery);
  const setCustomQuery = useDatabaseStore((state) => state.setCustomQuery);
  const setErrorMessage = useDatabaseStore((state) => state.setErrorMessage);
  const setIsAiLoading = useDatabaseStore((state) => state.setIsAiLoading);
  const isAiLoading = useDatabaseStore((state) => state.isAiLoading);

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
