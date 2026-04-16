import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SkipLinks from "./SkipLinks";

describe("SkipLinks", () => {
  it("renders the accessibility skip links documented in the README", () => {
    render(<SkipLinks />);

    expect(
      screen.getByRole("link", { name: /skip to main content/i })
    ).toHaveAttribute("href", "#main-content");
    expect(
      screen.getByRole("link", { name: /skip to table header/i })
    ).toHaveAttribute("href", "#tableHeader");
    expect(
      screen.getByRole("link", { name: /skip to pagination/i })
    ).toHaveAttribute("href", "#paginationControls");
    expect(
      screen.getByRole("link", { name: /skip to data section/i })
    ).toHaveAttribute("href", "#dataSection");
  });
});
