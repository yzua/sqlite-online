import { useCallback } from "react";
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

    if (!customQuery || !customQuery.startsWith("/ai ")) {
      return;
    }

    setIsAiLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert SQLite assistant. Your role is to generate a single, valid SQLite query based on the provided database schema and user prompt.
                **Instructions:**
                1. **Analyze the Schema:** Carefully review the following table and index information to understand the database structure.
                2. **Interpret the Prompt:** Understand the user's request and translate it into a precise SQLite query.
                3. **Generate SQL Only:** Your output must be **only** the raw SQL query. Do not include any other text, explanations, or markdown formatting.
                4. **Use SQL Comments for Notes:** If you need to add any notes or clarifications, use SQL comments (e.g., -- your note here).

                **Database Schema:**
                \`\`\`json
                ${JSON.stringify(tablesSchema, null, 2)}
                \`\`\`
                **User Prompt:**
                ${customQuery.substring(4)}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      let sqlQuery = data.candidates[0].content.parts[0].text;
      const sqlMatch = sqlQuery.match(/```(?:sql|sqlite)\n([\s\S]*?)\n```/);
      if (sqlMatch && sqlMatch[1]) {
        sqlQuery = sqlMatch[1].trim();
      } else {
        sqlQuery = sqlQuery.trim();
      }
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
