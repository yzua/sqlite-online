import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TableSchema } from "@/types";
import { isAiPrompt, requestGeminiSql } from "./gemini";

const tablesSchema: TableSchema = {
  users: {
    primaryKey: "id",
    type: "table",
    schema: [
      {
        name: "id",
        cid: 0,
        type: "INTEGER",
        dflt_value: "",
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false
      }
    ]
  }
};

describe("gemini helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("detects only slash-ai prompts", () => {
    expect(isAiPrompt("/ai show all users")).toBe(true);
    expect(isAiPrompt("/AI show all users")).toBe(false);
    expect(isAiPrompt("select * from users")).toBe(false);
  });

  it("sends schema context and extracts fenced sql responses", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "```sql\nSELECT * FROM users;\n```" }]
            }
          }
        ]
      })
    } as Response);

    await expect(
      requestGeminiSql("api-key", "/ai show all users", tablesSchema)
    ).resolves.toBe("SELECT * FROM users;");

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    const body = typeof init?.body === "string" ? init.body : "";
    const parsedBody = JSON.parse(body) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    const promptText = parsedBody.contents[0]?.parts[0]?.text ?? "";

    expect(url).toContain("?key=api-key");
    expect(init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    expect(promptText).toContain("**User Prompt:**");
    expect(promptText).toContain('"users"');
  });

  it("returns raw sql text when the model response is not fenced", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "SELECT name FROM users ORDER BY name" }]
            }
          }
        ]
      })
    } as Response);

    await expect(
      requestGeminiSql("api-key", "/ai list user names", tablesSchema)
    ).resolves.toBe("SELECT name FROM users ORDER BY name");
  });

  it("throws for unexpected Gemini payloads", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ invalid: true })
    } as Response);

    await expect(
      requestGeminiSql("api-key", "/ai list user names", tablesSchema)
    ).rejects.toThrow("Unexpected Gemini response format");
  });
});
