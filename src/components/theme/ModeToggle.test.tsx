import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useTheme from "@/hooks/useTheme";
import ModeToggle from "./ModeToggle";

vi.mock("@/hooks/useTheme", () => ({
  default: vi.fn()
}));

describe("ModeToggle", () => {
  const setTheme = vi.fn();

  beforeEach(() => {
    setTheme.mockReset();
  });

  it("renders the dark-mode label when the current theme is light", async () => {
    const user = userEvent.setup();
    vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme });

    render(<ModeToggle />);

    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(button).toHaveAttribute("title", "Switch to dark mode");

    await user.click(button);

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("renders the light-mode label when the current theme is dark", async () => {
    const user = userEvent.setup();
    vi.mocked(useTheme).mockReturnValue({ theme: "dark", setTheme });

    render(<ModeToggle />);

    const button = screen.getByRole("button", {
      name: /switch to light mode/i
    });
    expect(button).toHaveAttribute("title", "Switch to light mode");

    await user.click(button);

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
