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
  /** When "player", only toasts with viewport "player" are shown (e.g. inside collection player). Omit for default page toaster. */
  viewport?: "default" | "player";
  /** Optional className for the viewport (e.g. to position player toasts above the player). */
  viewportClassName?: string;
}

export function Toaster({ viewport: viewportFilter, viewportClassName }: ToasterProps = {}) {
  const { toasts } = useToast();
  const filtered =
    viewportFilter === "player"
      ? toasts.filter((t) => t.viewport === "player")
      : toasts.filter((t) => t.viewport !== "player");

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
