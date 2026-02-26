import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { FiX } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { HttpService } from "@/services/HttpService";

export interface CertificatePreviewDetails {
  recipientName?: string;
}

interface CertificatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewUrl: string;
  details?: CertificatePreviewDetails;
}

/** Escapes a string for safe use inside SVG/XML text content (prevents XSS). */
function escapeForSvg(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Replaces only {{credentialSubject.recipientName}} with the given name (escaped for SVG). Exported for tests. */
export function replacePlaceholders(text: string, recipientName: string): string {
  const safe = escapeForSvg(recipientName);
  return text.replace(/\{\{\s*credentialSubject\.recipientName\s*\}\}/g, safe);
}

export default function CertificatePreviewModal({
  open,
  onClose,
  previewUrl,
  details,
}: CertificatePreviewModalProps) {
  const { t } = useAppI18n();
  const [src, setSrc] = useState<string>(previewUrl);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !previewUrl) {
      setSrc(previewUrl);
      return;
    }
    const name = details?.recipientName ?? "";
    if (!name) {
      setSrc(previewUrl);
      return;
    }

    const controller = new AbortController();

    const httpService = new HttpService();
    httpService
      .get<string>(previewUrl, { responseType: "text", signal: controller.signal })
      .then((text) => {
        if (controller.signal.aborted) return;
        if (!text || typeof text !== "string" || !text.includes("credentialSubject.recipientName")) {
          setSrc(previewUrl);
          return;
        }
        const out = replacePlaceholders(text, name);
        const trimmed = out.trim().toLowerCase();
        const isSvg =
          trimmed.startsWith("<svg") || trimmed.startsWith("<?xml");
        if (isSvg) {
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          const blob = new Blob([out], { type: "image/svg+xml" });
          blobUrlRef.current = URL.createObjectURL(blob);
          setSrc(blobUrlRef.current);
        } else {
          setSrc(previewUrl);
        }
      })
      .catch((err) => {
        if (HttpService.isCancel(err)) return;
        setSrc(previewUrl);
      });

    return () => {
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, previewUrl, details?.recipientName]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("courseDetails.previewCertificate")}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold font-rubik text-foreground">
            {t("courseDetails.previewCertificate")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("close")}
          >
            <FiX className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 p-4 overflow-auto">
          <img src={src} alt={t("courseDetails.previewCertificate")} className="w-full h-auto object-contain" />
        </div>
      </div>
    </div>
  );
}
