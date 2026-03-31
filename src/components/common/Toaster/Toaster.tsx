import { Toaster } from "sonner";

function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        className: "custom-toast",
        duration: 2200,
        style: {
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.22)",
          border: "1px solid var(--border)",
          background: "var(--background)",
          color: "var(--foreground)"
        }
      }}
    />
  );
}

export default AppToaster;
