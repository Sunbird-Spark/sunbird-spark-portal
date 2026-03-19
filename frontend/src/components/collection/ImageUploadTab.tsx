import React from "react";
import { FiUpload } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface ImageUploadTabProps {
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
  uploadPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleDrop: (e: React.DragEvent) => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadFileName: string;
  setUploadFileName: (name: string) => void;
  uploadCreator: string;
  handleBack: () => void;
  handleCancel: () => void;
  handleUploadAndUse: () => void;
  uploadFile: File | null;
  LICENSE_STATEMENT: string;
  labelClass?: string;
  inputClass?: string;
}

export function ImageUploadTab({
  dragging,
  setDragging,
  uploadPreview,
  fileInputRef,
  handleDrop,
  handleFileInput,
  uploadFileName,
  setUploadFileName,
  uploadCreator,
  handleBack,
  handleCancel,
  handleUploadAndUse,
  uploadFile,
  LICENSE_STATEMENT,
  labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']",
  inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']",
}: ImageUploadTabProps) {
  return (
    <div className="p-5 space-y-4">
      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "rounded-xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 py-8 px-4",
          dragging
            ? "border-sunbird-brick bg-sunbird-brick/5"
            : "border-border hover:border-sunbird-brick hover:bg-gray-50"
        )}
      >
        {uploadPreview ? (
          <img
            src={uploadPreview}
            alt="preview"
            className="max-h-24 max-w-full object-contain rounded"
          />
        ) : (
          <>
            <FiUpload className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-['Rubik'] text-center">
              Choose or drag and drop your image here
            </p>
            <p className="text-xs text-muted-foreground font-['Rubik']">
              PNG, JPG, SVG supported
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Copyrights and License */}
      <div>
        <label className={labelClass}>
          Copyrights and License <span className="text-red-500">*</span>
        </label>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800 font-['Rubik'] leading-relaxed">
            {LICENSE_STATEMENT}
          </p>
        </div>
      </div>

      {/* File Name */}
      <div>
        <label className={labelClass}>
          File name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="File name"
          value={uploadFileName}
          onChange={(e) => setUploadFileName(e.target.value)}
        />
      </div>

      {/* Creator */}
      <div>
        <label className={labelClass}>Creator</label>
        <input
          type="text"
          className={cn(inputClass, "bg-gray-50 text-muted-foreground cursor-default")}
          readOnly
          value={uploadCreator}
          placeholder="Loading…"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-lg px-4 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
          data-edataid="cert-image-upload-back"
          data-pageid="course-consumption"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
          data-edataid="cert-image-upload-cancel"
          data-pageid="course-consumption"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!uploadFile || !uploadFileName.trim()}
          onClick={handleUploadAndUse}
          data-edataid="cert-image-upload-confirm"
          data-edatatype="SUBMIT"
          data-pageid="course-consumption"
          className={cn(
            "ml-auto rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors font-['Rubik'] inline-flex items-center gap-2",
            !uploadFile || !uploadFileName.trim()
              ? "bg-sunbird-brick/40 cursor-not-allowed"
              : "bg-sunbird-brick hover:bg-opacity-90"
          )}
        >
          <FiUpload className="w-4 h-4" />
          Upload &amp; Use
        </button>
      </div>
    </div>
  );
}
