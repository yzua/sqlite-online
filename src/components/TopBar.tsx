import { DatabaseIcon, GitForkIcon, SaveIcon } from "lucide-react";
import HighContrastToggle from "@/components/accessibility/HighContrastToggle";
import ModeToggle from "@/components/theme/ModeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useDatabaseWorker from "@/hooks/useWorker";

function TopBar() {
  const { handleFileChange, handleDownload } = useDatabaseWorker();

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-1 py-1.5 sm:flex-nowrap">
      <section
        className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
        aria-label="Database file operations"
      >
        <label
          htmlFor="file-upload"
          className="focus-within:ring-ring relative cursor-pointer rounded-md transition-opacity focus-within:ring-2 focus-within:ring-offset-2 hover:opacity-80"
        >
          <Input
            id="file-upload"
            type="file"
            accept=".db,.sqlite,.sqlite3"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileChange}
            aria-describedby="file-upload-description"
          />
          <span id="file-upload-description" className="sr-only">
            Select a SQLite database file to open (.db, .sqlite, .sqlite3)
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-foreground/25 pointer-events-none w-full cursor-pointer text-xs font-medium sm:w-[200px]"
            aria-hidden="true"
            tabIndex={-1}
          >
            <DatabaseIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Open Database
          </Button>
        </label>
        <Button
          size="sm"
          variant="outline"
          className="border-foreground/25 text-xs font-medium"
          onClick={handleDownload}
          aria-label="Save current database to file"
        >
          <SaveIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Save Database
        </Button>
      </section>

      <section
        className="ml-auto flex items-center gap-1"
        aria-label="Application settings and links"
      >
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="hidden sm:inline-flex"
        >
          <a
            href="https://github.com/yzua/sqlite-online"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source code on GitHub (opens in new tab)"
          >
            <GitForkIcon className="h-4 w-4" />
          </a>
        </Button>

        <HighContrastToggle />
        <ModeToggle />
      </section>
    </header>
  );
}

export default TopBar;
