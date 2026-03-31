import { ContrastIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("high-contrast") === "true";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", isHighContrast);
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem("high-contrast", String(newValue));
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleHighContrast}
      aria-label={`${isHighContrast ? "Disable" : "Enable"} high contrast mode`}
      aria-pressed={isHighContrast}
      title={`${isHighContrast ? "Disable" : "Enable"} high contrast mode for better visibility`}
    >
      <ContrastIcon className="h-4 w-4" />
    </Button>
  );
}

export default HighContrastToggle;
