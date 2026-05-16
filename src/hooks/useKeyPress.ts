import { useEffect } from "react";

const useKeyPress = (
  keyCombo: string,
  callback: () => void,
  caseSensitive = false
) => {
  useEffect(() => {
    if (!keyCombo || typeof keyCombo !== "string" || !callback) {
      return;
    }

    const keys = keyCombo.split("+");
    const ctrlRequired = keys.includes("ctrl");
    const targetKey = keys.find((k) => k !== "ctrl");

    if (!targetKey) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return;

      if (ctrlRequired && !event.ctrlKey) return;

      const eventKey = caseSensitive ? event.key : event.key.toLowerCase();
      const expected = caseSensitive ? targetKey : targetKey.toLowerCase();
      if (eventKey !== expected) return;

      event.preventDefault();
      event.stopPropagation();
      callback();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keyCombo, callback, caseSensitive]);
};

export default useKeyPress;
