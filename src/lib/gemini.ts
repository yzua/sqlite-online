import type { TableSchema } from "@/types";

const GEMINI_MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

export function isAiPrompt(query: string) {
  return query.startsWith("/ai ");
}

export function buildGeminiPrompt(query: string, tablesSchema: TableSchema) {
  const schemaJson = JSON.stringify(tablesSchema, null, 2);

  return `You are an expert SQLite assistant. Your role is to generate a single, valid SQLite query based on the provided database schema and user prompt.
                **Instructions:**
                1. **Analyze the Schema:** Carefully review the following table and index information to understand the database structure.
                2. **Interpret the Prompt:** Understand the user's request and translate it into a precise SQLite query.
                3. **Generate SQL Only:** Your output must be **only** the raw SQL query. Do not include any other text, explanations, or markdown formatting.
                4. **Use SQL Comments for Notes:** If you need to add any notes or clarifications, use SQL comments (e.g., -- your note here).

                **Database Schema:**
                ${schemaJson}
                **User Prompt:**
                ${query.substring(4)}`;
}

export async function requestGeminiSql(
  apiKey: string,
  query: string,
  tablesSchema: TableSchema
) {
  const response = await fetch(`${GEMINI_MODEL_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildGeminiPrompt(query, tablesSchema)
            }
          ]
        }
      ]
    })
  });

  const data = await response.json();
  return parseGeminiSqlResponse(data);
}

export function parseGeminiSqlResponse(data: unknown) {
  const rawText = extractCandidateText(data);
  const sqlMatch = rawText.match(/```(?:sql|sqlite)\n([\s\S]*?)\n```/);
  return sqlMatch?.[1] ? sqlMatch[1].trim() : rawText.trim();
}

function extractCandidateText(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "candidates" in data &&
    Array.isArray(data.candidates)
  ) {
    const firstCandidate = data.candidates[0];
    if (
      typeof firstCandidate === "object" &&
      firstCandidate !== null &&
      "content" in firstCandidate
    ) {
      const content = firstCandidate.content;
      if (
        typeof content === "object" &&
        content !== null &&
        "parts" in content &&
        Array.isArray(content.parts)
      ) {
        const firstPart = content.parts[0];
        if (
          typeof firstPart === "object" &&
          firstPart !== null &&
          "text" in firstPart &&
          typeof firstPart.text === "string"
        ) {
          return firstPart.text;
        }
      }
    }
  }

  throw new Error("Unexpected Gemini response format");
}
