import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import App from "./App";

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn()
}));

vi.mock("@/components/accessibility/LiveRegion", () => ({
  default: () => <div>Live Region</div>
}));

vi.mock("@/components/accessibility/SkipLinks", () => ({
  default: () => <nav>Skip Links</nav>
}));

vi.mock("@/components/browseTab/BrowseTab", () => ({
  default: () => <section>Browse Tab Content</section>
}));

vi.mock("@/components/FileDropHandler", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock("@/components/structureTab/StructureTab", () => ({
  default: () => <section>Structure Tab Content</section>
}));

vi.mock("@/components/TopBar", () => ({
  default: () => <header>Top Bar</header>
}));

vi.mock("./components/DatabaseURLLoader", () => ({
  default: () => <div>URL Loader</div>
}));

vi.mock("@/components/executeTab/ExecuteTab", () => ({
  default: () => <section>Execute Tab Content</section>
}));

describe("App", () => {
  beforeEach(() => {
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector({ isDatabaseLoading: false } as never)
    );
  });

  it("renders the shell and browse content when the database is ready", () => {
    render(<App />);

    expect(screen.getByText("Skip Links")).toBeInTheDocument();
    expect(screen.getByText("URL Loader")).toBeInTheDocument();
    expect(screen.getByText("Top Bar")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: /browse and filter database table data/i
      })
    ).toBeEnabled();
    expect(screen.getByText("Browse Tab Content")).toBeInTheDocument();
    expect(screen.getByText("Live Region")).toBeInTheDocument();
  });

  it("shows the loading state and disables navigation while loading", () => {
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector({ isDatabaseLoading: true } as never)
    );

    render(<App />);

    expect(screen.getByText("Loading Database")).toBeInTheDocument();
    expect(
      screen.getByText("Please wait while the database is initializing")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /browse and filter/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("tab", { name: /execute custom sql queries/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("tab", {
        name: /view database schema and table structure/i
      })
    ).toBeDisabled();
  });

  it("switches to structure and execute tabs", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(
      screen.getByRole("tab", {
        name: /view database schema and table structure/i
      })
    );
    expect(screen.getByText("Structure Tab Content")).toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: /execute custom sql queries/i })
    );
    expect(await screen.findByText("Execute Tab Content")).toBeInTheDocument();
  });
});
