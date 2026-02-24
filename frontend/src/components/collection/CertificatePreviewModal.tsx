import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { FiX } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";

export interface CertificatePreviewDetails {
  recipientName?: string;
  trainingName?: string;
  issuanceDate?: string;
}

export function formatIssuanceDateLong(date: Date): string {
  const day = date.getDate();
  const d = day < 10 ? `0${day}` : String(day);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

interface CertificatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  previewUrl: string;
  details?: CertificatePreviewDetails;
}

export function replacePlaceholders(
  text: string,
  recipientName: string,
  trainingName: string,
  issuanceDate: string
): string {
  return text
    .replace(/\{\{\s*credentialSubject\.recipientName\s*\}\}/g, recipientName)
    .replace(/\{\{\s*credentialSubject\.trainingName\s*\}\}/g, trainingName)
    .replace(/\{\{\s*dateFormat\s+issuanceDate\s+["'][^"']*["']\s*\}\}/gi, issuanceDate);
}

export default function CertificatePreviewModal({
  open,
  onClose,
  previewUrl,
  details,
}: CertificatePreviewModalProps) {
  const { t } = useAppI18n();
  const [src, setSrc] = useState<string>(previewUrl);
  const [html, setHtml] = useState<string | null>(null);
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
      setHtml(null);
      return;
    }
    const name = details?.recipientName ?? "";
    const course = details?.trainingName ?? "";
    const date = details?.issuanceDate ?? "";
    if (!name && !course && !date) {
      setSrc(previewUrl);
      setHtml(null);
      return;
    }

    fetch(previewUrl)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (!text || (!text.includes("credentialSubject") && !text.includes("dateFormat"))) {
          setSrc(previewUrl);
          setHtml(null);
          return;
        }
        const out = replacePlaceholders(text, name, course, date);
        if (out.trim().toLowerCase().includes("<svg") || out.trim().toLowerCase().startsWith("<?xml")) {
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          const blob = new Blob([out], { type: "image/svg+xml" });
          blobUrlRef.current = URL.createObjectURL(blob);
          setSrc(blobUrlRef.current);
          setHtml(null);
        } else if (out.trim().toLowerCase().includes("<html") || out.trim().toLowerCase().includes("<body")) {
          setHtml(out);
          setSrc(previewUrl);
        } else {
          setSrc(previewUrl);
          setHtml(null);
        }
      })
      .catch(() => {
        setSrc(previewUrl);
        setHtml(null);
      });

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, previewUrl, details?.recipientName, details?.trainingName, details?.issuanceDate]);

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
          {html ? (
            <iframe title={t("courseDetails.previewCertificate")} srcDoc={html} className="w-full min-h-[400px] border-0 rounded-lg bg-white" sandbox="allow-same-origin" />
          ) : (
            <img src={src} alt={t("courseDetails.previewCertificate")} className="w-full h-auto object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
