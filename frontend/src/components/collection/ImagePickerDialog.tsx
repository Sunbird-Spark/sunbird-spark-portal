import React, { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiImage, FiUpload } from "react-icons/fi";
import { useMyImages, useAllImages } from "@/hooks/useCertificate";
import { cn } from "@/lib/utils";
import { ImageGallery } from "@/components/collection/ImageGallery";
import { ImageUploadTab } from "@/components/collection/ImageUploadTab";
import { userService } from "@/services/UserService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { resolveUserAndOrg } from "@/utils/userUtils";
import { useAppI18n } from "@/hooks/useAppI18n";

export interface ImagePickerState {
  preview: string | null;
  artifactUrl: string | null;
  file: File | null;
}

export const emptyImage = (): ImagePickerState => ({
  preview: null,
  artifactUrl: null,
  file: null,
});

type ImageTab = "myImages" | "allImages" | "upload";

const labelClass =
  "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']";
const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']";

const LICENSE_STATEMENT =
  "I understand and confirm that all resources and assets created through the content editor or uploaded on the platform shall be available for free and public use without limitations on the platform (web portal, applications and any other end-user interface that the platform would enable) as per platform policy guidelines. In doing so, I confirm that the copyright and license of the original author are not infringed.";

interface ImagePickerProps {
  label: string;
  required?: boolean;
  value: ImagePickerState;
  onChange: (v: ImagePickerState) => void;
}

export function ImagePickerDialog({ label, required, value, onChange }: ImagePickerProps) {
  const { t } = useAppI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ImageTab>("myImages");

  /* Upload tab state */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCreator, setUploadCreator] = useState("");
  const [dragging, setDragging] = useState(false);

  const { data: myImages = [], isLoading: loadingMy } = useMyImages();
  const { data: allImages = [], isLoading: loadingAll } = useAllImages();

  /* ── Resolve creator name once when upload tab opens ── */
  const initUploadTab = async () => {
    if (uploadCreator) return;
    try {
      const { userName } = await resolveUserAndOrg();
      setUploadCreator(userName);
    } catch { /* ignore */ }
  };

  const handleTabChange = (t: ImageTab) => {
    setTab(t);
    if (t === "upload") initUploadTab();
  };

  /* ── File handling ── */
  const applyFile = (file: File) => {
    setUploadFile(file);
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) applyFile(f);
  };

  const handleSelectImage = (url: string) => {
    onChange({ preview: url, artifactUrl: url, file: null });
    setOpen(false);
  };

  const handleUploadAndUse = () => {
    if (!uploadFile || !uploadPreview) return;
    onChange({ preview: uploadPreview, artifactUrl: null, file: uploadFile });
    setOpen(false);
    /* Reset upload tab state */
    setUploadFile(null);
    setUploadPreview(null);
    setUploadFileName("");
  };

  const handleBack = () => setTab("myImages");

  const tabBtn = (t: ImageTab, txt: string) => (
    <button
      key={t}
      type="button"
      onClick={() => handleTabChange(t)}
      className={cn(
        "flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors",
        tab === t ? "text-sunbird-brick" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {txt}
      {tab === t && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
      )}
    </button>
  );

  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger / preview */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full rounded-lg border border-dashed border-border py-3 flex items-center justify-center gap-2 text-sm font-['Rubik'] transition-colors hover:border-sunbird-brick hover:text-sunbird-brick",
          value.preview ? "text-sunbird-brick border-sunbird-brick/40" : "text-muted-foreground"
        )}
      >
        {value.preview ? (
          <>
            <img src={value.preview} alt="selected" className="h-8 w-8 rounded object-cover" />
            <span className="text-xs">{t('imagePicker.changeImage')}</span>
          </>
        ) : (
          <>
            <FiImage className="w-4 h-4" />
            <span>{t('imagePicker.selectImage')}</span>
          </>
        )}
      </button>
      {value.preview && (
        <button
          type="button"
          onClick={() => onChange(emptyImage())}
          className="mt-1 text-xs text-red-400 hover:text-red-600 font-['Rubik']"
        >
          {t('imagePicker.remove')}
        </button>
      )}

      {/* Child dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl focus:outline-none overflow-hidden flex flex-col"
            style={{ width: "min(92vw, 38rem)", maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <Dialog.Title className="text-base font-semibold text-sunbird-obsidian font-['Rubik']">
                {t('imagePicker.selectImageTitle', { label })}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Tabs */}
            {tab !== "upload" && (
              <div className="flex border-b border-border shrink-0">
                {tabBtn("myImages", t('imagePicker.myImages'))}
                {tabBtn("allImages", t('imagePicker.allImages'))}
                {tabBtn("upload", t('imagePicker.uploadImage'))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* My Images */}
              {tab === "myImages" && (
                <div className="p-4">
                  <ImageGallery
                    loading={loadingMy}
                    images={myImages}
                    emptyMessage={t('imagePicker.noImagesUploaded')}
                    selectedUrl={value.artifactUrl}
                    onSelect={handleSelectImage}
                  />
                </div>
              )}

              {/* All Images */}
              {tab === "allImages" && (
                <div className="p-4">
                  <ImageGallery
                    loading={loadingAll}
                    images={allImages}
                    emptyMessage={t('imagePicker.noImagesFound')}
                    selectedUrl={value.artifactUrl}
                    onSelect={handleSelectImage}
                  />
                </div>
              )}

              {/* Upload Image */}
              {tab === "upload" && (
                <ImageUploadTab
                  dragging={dragging}
                  setDragging={setDragging}
                  uploadPreview={uploadPreview}
                  fileInputRef={fileInputRef}
                  handleDrop={handleDrop}
                  handleFileInput={handleFileInput}
                  uploadFileName={uploadFileName}
                  setUploadFileName={setUploadFileName}
                  uploadCreator={uploadCreator}
                  handleBack={handleBack}
                  handleCancel={() => setOpen(false)}
                  handleUploadAndUse={handleUploadAndUse}
                  uploadFile={uploadFile}
                  LICENSE_STATEMENT={LICENSE_STATEMENT}
                  labelClass={labelClass}
                  inputClass={inputClass}
                />
              )}
            </div>

            {/* Footer (My/All Images tabs) */}
            {tab !== "upload" && (
              <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-border shrink-0">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                  >
                    {t('imagePicker.cancel')}
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => handleTabChange("upload")}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-sunbird-brick border border-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors font-['Rubik'] inline-flex items-center gap-2"
                >
                  <FiUpload className="w-4 h-4" />
                  {t('imagePicker.uploadNew')}
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
