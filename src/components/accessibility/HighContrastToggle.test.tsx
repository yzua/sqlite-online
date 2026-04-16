import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import HighContrastToggle from "./HighContrastToggle";

describe("HighContrastToggle", () => {
  it("hydrates from storage and toggles the root high-contrast class", async () => {
    const user = userEvent.setup();
    localStorage.setItem("high-contrast", "true");

    render(<HighContrastToggle />);

    const button = screen.getByRole("button", {
      name: /disable high contrast mode/i
    });

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("high-contrast");

    await user.click(button);

    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).not.toHaveClass("high-contrast");
    expect(localStorage.getItem("high-contrast")).toBe("false");
  });
});
