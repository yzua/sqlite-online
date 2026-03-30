import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50",
        "bg-primary text-primary-foreground rounded-md px-4 py-2 font-medium",
        "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </a>
  );
}

function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#tableHeader">Skip to table header</SkipLink>
      <SkipLink href="#paginationControls">Skip to pagination</SkipLink>
      <SkipLink href="#dataSection">Skip to data section</SkipLink>
    </div>
  );
}

export default SkipLinks;
export { SkipLink };
