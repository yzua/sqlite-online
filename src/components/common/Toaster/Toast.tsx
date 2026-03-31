import { AlertCircleIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";
import { toast } from "sonner";

type ToastType = "success" | "error" | "info";
type ToastOptions = Record<string, unknown>;

const borderColorMap = {
  success: "var(--success)",
  error: "var(--destructive)",
  info: "var(--info)"
};

const iconWrapperClassMap = {
  success: "bg-success/12 text-success",
  error: "bg-destructive/12 text-destructive",
  info: "bg-info/12 text-info"
};

function showToast(
  message: string | React.ReactNode,
  type: ToastType = "info",
  options: ToastOptions = {}
) {
  if (typeof message === "string") {
    const iconMap = {
      success: <CheckCircle2Icon className="h-4 w-4" />,
      error: <AlertCircleIcon className="h-4 w-4" />,
      info: <InfoIcon className="h-4 w-4" />
    };
    setTimeout(() => {
      toast(
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconWrapperClassMap[type]}`}
          >
            {iconMap[type]}
          </div>
          <div className="min-w-0 flex-1 text-sm font-medium">{message}</div>
        </div>,
        {
          style: {
            background: "var(--background)",
            border: `1px solid color-mix(in oklab, var(--border) 82%, ${borderColorMap[type]} 18%)`
          },
          ...options
        }
      );
    }, 0);
  } else {
    setTimeout(() => {
      toast(message, {
        style: {
          background: "var(--background)",
          border: `1px solid color-mix(in oklab, var(--border) 82%, ${borderColorMap[type]} 18%)`
        },
        ...options
      });
    }, 0);
  }
}

export default showToast;
