import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ContrastIcon } from "lucide-react";

function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check if high contrast is already enabled
    const saved = localStorage.getItem("high-contrast");
    const enabled = saved === "true";
    setIsHighContrast(enabled);

    if (enabled) {
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem("high-contrast", String(newValue));

    if (newValue) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-8 w-8"
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
