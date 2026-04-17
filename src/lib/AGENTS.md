# src/lib

Shared utilities with no React component dependencies.

## Files

| File                     | Export                           | Role                                                                                                                        |
| ------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `utils.ts`               | `cn`                             | Tailwind class merge: `clsx` + `tailwind-merge`. Used by all shadcn/ui components and most custom components.               |
| `queryCache.ts`          | `tableDataCache`                 | Generic LRU cache (100 entries, 5-min TTL). Keyed by `table:limit:offset:filters:sorters`. Supports per-table invalidation. |
| `gemini.ts`              | `isAiPrompt`, `requestGeminiSql` | Gemini 1.5 Flash integration. Detects `/ai` prefix, calls API with schema context, parses SQL from response.                |
| `secureStorage.ts`       | `SecureStorage` (default)        | AES-GCM encrypted storage via Web Crypto API. Fallback to base64 in localStorage when `crypto.subtle` unavailable.          |
| `apiKeyStorage.ts`       | `storeApiKey`, `loadApiKey`      | Gemini API key persistence. Stores/loads via `SecureStorage` with legacy localStorage migration.                            |
| `calculateTableLimit.ts` | `calculateTableLimit`            | Computes row limit from DOM section heights. Used by `WorkerProvider`. Falls back to 50 when DOM measurements unavailable.  |
| `debounce.ts`            | `debounce`                       | Generic debounce with `cancel()`. Used by `usePanelStore` and `FilterInput`.                                                |
| `parseSqlStatements.ts`  | `parseSqlStatements`             | Splits SQL text into individual statements. Strips comments (`--` and `/* */`), splits on `;`, trims whitespace.            |
| `toast.tsx`              | `showToast` (default)            | Toast notification helper wrapping `sonner`. Renders themed icon + message. Side-effect function (no hooks).                |

## Key Patterns

- Most exports are pure functions or singleton objects. `toast.tsx` is the exception: it renders JSX via `sonner` as a side effect. No React hooks in this directory.
- `SecureStorage` is an object module (not a class). Async encrypt/decrypt.
- `queryCache` is a singleton `QueryCache` instance consumed by `src/sqlite/core.ts`.
- `gemini.ts` functions are consumed by `src/hooks/useGeminiAI.ts`.

## Guidelines

- New shared utilities that have no React dependency belong here.
- If a utility needs React hooks, put it in `src/hooks/` instead.
- Do not import from `@/components` or `@/providers` here; this directory is
  lower in the dependency graph.
