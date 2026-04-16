import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import useTheme from "@/hooks/useTheme";
import ThemeProvider from "./ThemeProvider";

function ThemeConsumer() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <output>{theme}</output>
      <button type="button" onClick={() => setTheme("light")}>
        Switch theme
      </button>
    </>
  );
}

describe("ThemeProvider", () => {
  it("initializes from storage and applies the expected root class", () => {
    localStorage.setItem("ui-theme", "dark");

    render(
      <ThemeProvider storageKey="ui-theme">
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("persists updates and switches the document theme class", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <ThemeConsumer />
      </ThemeProvider>
    );

    await user.click(screen.getByRole("button", { name: /switch theme/i }));

    expect(localStorage.getItem("ui-theme")).toBe("light");
    expect(document.documentElement).toHaveClass("light");
  });
});
