import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import useKeyPress from "./useKeyPress";

function TestComponent({
  caseSensitive = false
}: Readonly<{ caseSensitive?: boolean }>) {
  const [count, setCount] = useState(0);

  useKeyPress(
    "ctrl+s",
    () => setCount((current) => current + 1),
    caseSensitive
  );

  return <output>{count}</output>;
}

describe("useKeyPress", () => {
  it("calls the callback for matching shortcuts", async () => {
    const user = userEvent.setup();

    render(<TestComponent />);
    await user.keyboard("{Control>}s{/Control}");

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("ignores non-matching shortcuts", async () => {
    const user = userEvent.setup();

    render(<TestComponent />);
    await user.keyboard("{Control>}x{/Control}");

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("supports case-sensitive matching when requested", async () => {
    const user = userEvent.setup();

    render(<TestComponent caseSensitive />);
    await user.keyboard("{Control>}S{/Control}");

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
