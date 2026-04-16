import { describe, expect, it } from "vitest";
import { parseSqlStatements } from "./parseSqlStatements";

describe("parseSqlStatements", () => {
  it("removes line and block comments before splitting statements", () => {
    expect(
      parseSqlStatements(`
        -- leading comment
        SELECT * FROM users;
        /* multi-line
           comment */
        UPDATE users SET name = 'Ada' WHERE id = 1;
      `)
    ).toEqual([
      "SELECT * FROM users",
      "UPDATE users SET name = 'Ada' WHERE id = 1"
    ]);
  });

  it("ignores empty statements caused by trailing semicolons", () => {
    expect(parseSqlStatements("SELECT 1;;;   ")).toEqual(["SELECT 1"]);
  });
});
