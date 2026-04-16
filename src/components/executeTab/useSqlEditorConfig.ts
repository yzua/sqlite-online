import {
  autocompletion,
  type CompletionContext,
  type CompletionResult
} from "@codemirror/autocomplete";
import { SQLite, sql } from "@codemirror/lang-sql";
import { useCallback, useMemo, useRef } from "react";
import type { TableSchema } from "@/types";
import { createSqlCompletionOptions } from "./sqlEditorCompletions";

export function useSqlEditorConfig(
  customQuery: string,
  tablesSchema: TableSchema
) {
  const completionOptions = useMemo(
    () => createSqlCompletionOptions(tablesSchema),
    [tablesSchema]
  );

  // Keep a ref to the current query so the completion source can check it
  // without being a dependency that recreates the extension.
  const queryRef = useRef(customQuery);
  queryRef.current = customQuery;

  const completions = useCallback(
    (context: CompletionContext): CompletionResult | null => {
      // Suppress SQL completions when typing an AI prompt
      if (queryRef.current.startsWith("/ai ")) {
        return null;
      }

      const word = context.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !context.explicit)) {
        return null;
      }

      return {
        from: word.from,
        to: word.to,
        options: completionOptions
      };
    },
    [completionOptions]
  );

  // Extensions are now stable — they don't change when the user types.
  // SQL language + autocompletion are always present; AI-prompt suppression
  // is handled inside the completion source via queryRef.
  return useMemo(() => {
    return [SQLite, sql(), autocompletion({ override: [completions] })];
  }, [completions]);
}
