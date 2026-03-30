import { useState, useEffect } from "react";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const geminiApiKey = useDatabaseStore((state) => state.geminiApiKey);
  const [apiKey, setApiKey] = useState(geminiApiKey || "");
  const setGeminiApiKey = useDatabaseStore((state) => state.setGeminiApiKey);

  useEffect(() => {
    if (isOpen) {
      setApiKey(geminiApiKey || "");
    }
  }, [isOpen, geminiApiKey]);

  const handleSave = () => {
    setGeminiApiKey(apiKey);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Gemini API Key</DialogTitle>
          <DialogDescription>
            You can get your API key from Google AI Studio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <Label htmlFor="api-key" className="text-right">
              API Key
            </Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-10 text-lg"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            To use AI, type{" "}
            <code className="bg-muted relative rounded px-2 py-1 font-mono text-sm font-semibold">
              /ai
            </code>{" "}
            followed by your prompt in the SQL editor.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeyModal;
