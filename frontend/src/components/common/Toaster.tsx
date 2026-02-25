import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./Toast";
import { useToast } from "@/hooks/useToast";

const VARIANT_EMOJIS: Record<string, string> = {
  default: "\u2139\uFE0F",
  destructive: "\u274C",
  success: "\uD83C\uDF89",
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          <div className="grid gap-1.5">
            {title && (
              <ToastTitle className="flex items-center gap-2 text-[15px] font-semibold leading-tight">
                <span className="text-base leading-none">{VARIANT_EMOJIS[variant || "default"]}</span>
                {title}
              </ToastTitle>
            )}
            {description && (
              <ToastDescription className="text-[13px] leading-snug opacity-80">
                {description}
              </ToastDescription>
            )}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
