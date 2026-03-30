import { memo, type ReactNode } from "react";

export const Span = memo(function Span({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`block max-w-80 overflow-hidden text-ellipsis ${
        className ?? ""
      }`}
    >
      {children}
    </span>
  );
});
