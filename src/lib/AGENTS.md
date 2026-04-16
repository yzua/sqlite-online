# src/lib

Shared utilities with no React component dependencies.

## Files

| File               | Export                           | Role                                                                                                                        |
| ------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `utils.ts`         | `cn`                             | Tailwind class merge: `clsx` + `tailwind-merge`. Used by all shadcn/ui components and most custom components.               |
| `queryCache.ts`    | `tableDataCache`                 | Generic LRU cache (100 entries, 5-min TTL). Keyed by `table:limit:offset:filters:sorters`. Supports per-table invalidation. |
| `gemini.ts`        | `isAiPrompt`, `requestGeminiSql` | Gemini 1.5 Flash integration. Detects `/ai` prefix, calls API with schema context, parses SQL from response.                |
| `secureStorage.ts` | `SecureStorage` (default)        | AES-GCM encrypted storage via Web Crypto API. Fallback to base64 in localStorage when `crypto.subtle` unavailable.          |

## Key Patterns

- All exports are pure functions or singleton objects. No React hooks.
- `SecureStorage` is an object module (not a class). Async encrypt/decrypt.
- `queryCache` is a singleton `QueryCache` instance consumed by `src/sqlite/core.ts`.
- `gemini.ts` functions are consumed by `src/hooks/useGeminiAI.ts`.

## Guidelines

- New shared utilities that have no React dependency belong here.
- If a utility needs React hooks, put it in `src/hooks/` instead.
- Do not import from `@/components` or `@/providers` here; this directory is
  lower in the dependency graph.
