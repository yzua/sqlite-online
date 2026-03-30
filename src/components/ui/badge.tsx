function Badge({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="text-muted-foreground bg-primary/5 rounded px-2 py-0.5 text-xs italic">
      {children}
    </span>
  );
}

export default Badge;
