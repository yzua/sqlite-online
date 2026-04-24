# src/lib

Shared utilities with no React component dependencies.

## Files

| File                     | Export                | Role                                                                                                                       |
| ------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `utils.ts`               | `cn`                  | Tailwind class merge: `clsx` + `tailwind-merge`. Used by all shadcn/ui components and most custom components.              |
| `calculateTableLimit.ts` | `calculateTableLimit` | Computes row limit from DOM section heights. Used by `WorkerProvider`. Falls back to 50 when DOM measurements unavailable. |
| `download.ts`            | `triggerDownload`     | Creates a Blob URL and triggers a file download via a temporary `<a>` element. Used for database and CSV downloads.        |
| `debounce.ts`            | `debounce`            | Generic debounce with `cancel()`. Used by `usePanelStore` and `FilterInput`.                                               |

## Subdirectories

| Directory  | Contents                                                                         |
| ---------- | -------------------------------------------------------------------------------- |
| `ai/`      | `gemini.ts` (Gemini API integration), `apiKeyStorage.ts` (encrypted key storage) |
| `storage/` | `secureStorage.ts` (AES-GCM encrypted storage via Web Crypto API)                |

## Key Patterns

- Most exports are pure functions or singleton objects.
- `SecureStorage` is an object module (not a class). Async encrypt/decrypt.
- `gemini.ts` functions are consumed by `src/hooks/useGeminiAI.ts`.
- `queryCache` and `parseSqlStatements` were promoted to `src/sqlite/` (SQL domain).
- `toast.tsx` was promoted to `src/components/common/toast.tsx` (React component).

## Guidelines

- New shared utilities that have no React dependency belong here.
- If a utility needs React hooks, put it in `src/hooks/` instead.
- Do not import from `@/components` or `@/providers` here; this directory is
  lower in the dependency graph.
