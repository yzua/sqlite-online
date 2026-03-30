import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDatabaseStore } from "@/store/useDatabaseStore";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiKeyModalContentProps {
  initialApiKey: string;
  onClose: () => void;
}

function ApiKeyModalContent({
  initialApiKey,
  onClose
}: Readonly<ApiKeyModalContentProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setGeminiApiKey = useDatabaseStore((state) => state.setGeminiApiKey);

  const handleSave = () => {
    setGeminiApiKey(inputRef.current?.value ?? "");
    onClose();
  };

  return (
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
            ref={inputRef}
            defaultValue={initialApiKey}
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
  );
}

function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const geminiApiKey = useDatabaseStore((state) => state.geminiApiKey);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {isOpen ? (
        <ApiKeyModalContent
          initialApiKey={geminiApiKey || ""}
          onClose={onClose}
        />
      ) : null}
    </Dialog>
  );
}

export default ApiKeyModal;
