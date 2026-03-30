import { toast } from "sonner";

import { CheckCircle2Icon, InfoIcon, AlertCircleIcon } from "lucide-react";

type ToastType = "success" | "error" | "info";
type ToastOptions = Record<string, unknown>;

const borderColorMap = {
  success: "#22c55e",
  error: "#ef4444",
  info: "#3b82f6"
};

function showToast(
  message: string | React.ReactNode,
  type: ToastType = "info",
  options: ToastOptions = {}
) {
  if (typeof message === "string") {
    const iconMap = {
      success: <CheckCircle2Icon className="h-5 w-5 text-green-500" />,
      error: <AlertCircleIcon className="h-5 w-5 text-red-500" />,
      info: <InfoIcon className="h-5 w-5 text-blue-500" />
    };
    setTimeout(() => {
      toast(
        <div className="flex items-center gap-2">
          {iconMap[type]}
          <div className="flex-1 capitalize">{message}</div>
        </div>,
        {
          style: {
            borderLeft: `4px solid ${borderColorMap[type]}`,
            background: "var(--background)"
          },
          ...options
        }
      );
    }, 0);
  } else {
    setTimeout(() => {
      toast(message, {
        style: {
          borderLeft: `4px solid ${borderColorMap[type]}`,
          background: "var(--background)"
        },
        ...options
      });
    }, 0);
  }
}

export default showToast;
