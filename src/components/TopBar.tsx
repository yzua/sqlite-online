import { DatabaseIcon, GithubIcon, SaveIcon } from "lucide-react";
import HighContrastToggle from "@/components/accessibility/HighContrastToggle";
import ModeToggle from "@/components/theme/ModeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useDatabaseWorker from "@/hooks/useWorker";

function TopBar() {
  const { handleFileChange, handleDownload } = useDatabaseWorker();

  return (
    <header className="flex items-center justify-between gap-2 border-b px-1 py-1.5">
      <section
        className="flex items-center gap-1"
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
            className="border-foreground/25 pointer-events-none h-8 cursor-pointer px-3 text-xs font-medium sm:w-[200px]"
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
          className="border-foreground/25 h-8 px-3 text-xs font-medium"
          onClick={handleDownload}
          aria-label="Save current database to file"
        >
          <SaveIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Save Database
        </Button>
      </section>

      <section
        className="flex items-center gap-1"
        aria-label="Application settings and links"
      >
        <a
          href="https://github.com/yzua/sqlite-online"
          target="_blank"
          rel="noopener noreferrer"
          className="focus:ring-ring rounded-md transition-opacity hover:opacity-80 focus:ring-2 focus:ring-offset-2 focus:outline-none"
          aria-label="View source code on GitHub (opens in new tab)"
        >
          <Button
            size="icon"
            variant="ghost"
            className="hidden h-8 w-8 sm:flex"
            tabIndex={-1}
            aria-hidden="true"
          >
            <GithubIcon className="h-4 w-4" />
          </Button>
        </a>

        <HighContrastToggle />
        <ModeToggle />
      </section>
    </header>
  );
}

export default TopBar;
