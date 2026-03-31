import {
  autocompletion,
  type CompletionContext,
  type CompletionResult
} from "@codemirror/autocomplete";
import { SQLite, sql } from "@codemirror/lang-sql";
import { useCallback, useMemo } from "react";
import { isAiPrompt } from "@/lib/gemini";
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

  const completions = useCallback(
    (context: CompletionContext): CompletionResult | null => {
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

  return useMemo(() => {
    const completionExtension = autocompletion({ override: [completions] });
    return isAiPrompt(customQuery)
      ? [completionExtension]
      : [SQLite, sql(), completionExtension];
  }, [customQuery, completions]);
}
