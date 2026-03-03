import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./Toast";
import { useToast } from "@/hooks/useToast";

interface ToasterProps {
  /** When "center", only toasts with viewport "center" are shown (use viewportClassName to position, e.g. top-center). Omit for default page toaster. */
  viewport?: "default" | "center";
  /** Optional className for the viewport (e.g. to position toasts in center: !fixed !top-4 !left-1/2 !-translate-x-1/2). */
  viewportClassName?: string;
}

export function Toaster({ viewport: viewportFilter, viewportClassName }: ToasterProps = {}) {
  const { toasts } = useToast();
  const filtered =
    viewportFilter === "center"
      ? toasts.filter((t) => t.viewport === "center")
      : toasts.filter((t) => t.viewport !== "center");

  return (
    <ToastProvider>
      {filtered.map(({ id, title, description, action, viewport: _v, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className={viewportClassName} />
    </ToastProvider>
  );
}
