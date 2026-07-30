"use client"

/**
 * PosterUploadField
 * ─────────────────
 * Drop-in file input for research / event poster images.
 * Forces 3:4 crop before the file reaches the caller.
 *
 * Props:
 *   value     — current image URL (to show a preview)
 *   onChange  — called with the cropped File (caller handles upload)
 *   onRemove  — called when the user removes the current image
 *   disabled  — disables the button while uploading
 *   label     — field label text
 */

import React, { useRef } from "react"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { ImageCropModal } from "./ImageCropModal"
import { useImageCrop } from "@/hooks/useImageCrop"

interface PosterUploadFieldProps {
  value?: string | null
  onChange: (file: File) => void
  onRemove?: () => void
  disabled?: boolean
  isUploading?: boolean
  label?: string
  hint?: string
  maxSizeMB?: number
}

export function PosterUploadField({
  value,
  onChange,
  onRemove,
  disabled,
  isUploading,
  label = "Cover Image (3:4 poster)",
  hint = "Recommended: portrait orientation, 900×1200 px",
  maxSizeMB,
}: PosterUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { cropState, openCrop, closeCrop } = useImageCrop()

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }
    openCrop(file, "poster", (cropped) => {
      closeCrop()
      onChange(cropped)
    })
  }

  return (
    <>
      {cropState.open && (
        <ImageCropModal
          src={cropState.src}
          ratio={cropState.ratio}
          fileName={cropState.fileName}
          onCrop={cropState.onCrop}
          onCancel={closeCrop}
        />
      )}

      <div className="space-y-2">
        {label && (
          <p className="text-sm font-semibold">{label}</p>
        )}

        {value ? (
          /* Preview with remove button */
          <div className="relative inline-block group">
            {/* 3:4 preview */}
            <div
              className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/30"
              style={{ width: 120, aspectRatio: "3/4" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Poster preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Overlay buttons */}
            <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Replace image"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={disabled}
                  className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="absolute inset-0 rounded-lg bg-black/70 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
            )}
          </div>
        ) : (
          /* Upload trigger */
          <button
            type="button"
            onClick={() => !disabled && !isUploading && inputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-colors text-muted-foreground"
            style={{ width: 120, aspectRatio: "3/4" }}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-7 w-7 opacity-40" />
                <span className="text-[10px] text-center px-2 leading-tight opacity-60">
                  Upload<br />3:4 poster
                </span>
              </>
            )}
          </button>
        )}

        {hint && !value && (
          <p className="text-[11px] text-muted-foreground/60">{hint}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelected}
          disabled={disabled || isUploading}
        />
      </div>
    </>
  )
}
