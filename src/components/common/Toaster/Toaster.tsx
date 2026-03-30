import { Toaster } from "sonner";

function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        className: "custom-toast",
        duration: 2000,
        style: {
          fontFamily: "Lexend, sans-serif",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          border: "1px solid var(--border)",
          background: "var(--background)",
          color: "var(--foreground)"
        }
      }}
    />
  );
}

export default AppToaster;
