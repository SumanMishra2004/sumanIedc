"use client"

/**
 * ImageCropModal
 * ──────────────
 * A reusable crop dialog powered by react-image-crop.
 *
 * Supported aspect ratios:
 *   "poster"   →  3 / 4  (research & event posters)
 *   "avatar"   →  1 / 1  (LinkedIn-style profile photo)
 *   "cover"    →  LinkedIn cover = 1584 × 396 → 4 / 1
 */

import React, { useCallback, useRef, useState } from "react"
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type CropRatio = "poster" | "avatar" | "cover"

interface ImageCropModalProps {
  /** Blob URL or data URL of the image to crop */
  src: string
  /** Which aspect ratio to enforce */
  ratio: CropRatio
  /** Called with the cropped File when the user confirms */
  onCrop: (file: File) => void
  /** Called when the modal is dismissed */
  onCancel: () => void
  /** Original file name (used for the output file) */
  fileName?: string
}

// ─── Ratio config ─────────────────────────────────────────────────────────────

const RATIO_CONFIG: Record<
  CropRatio,
  { aspect: number; label: string; hint: string; outputWidth: number; outputHeight: number }
> = {
  poster: {
    aspect: 3 / 4,
    label: "Poster (3 : 4)",
    hint: "Best for research papers and event posters",
    outputWidth: 900,
    outputHeight: 1200,
  },
  avatar: {
    aspect: 1 / 1,
    label: "Profile Photo (1 : 1)",
    hint: "Square — same as LinkedIn profile photo",
    outputWidth: 400,
    outputHeight: 400,
  },
  cover: {
    aspect: 1584 / 396,
    label: "Cover Photo (4 : 1)",
    hint: "LinkedIn cover banner — 1584 × 396 px",
    outputWidth: 1584,
    outputHeight: 396,
  },
}

// ─── Canvas helper ────────────────────────────────────────────────────────────

function getCroppedBlob(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  outputWidth: number,
  outputHeight: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Cannot get canvas context")

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Canvas toBlob failed"))
      },
      "image/jpeg",
      0.92,
    )
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageCropModal({
  src,
  ratio,
  onCrop,
  onCancel,
  fileName = "image.jpg",
}: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const config = RATIO_CONFIG[ratio]

  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isSaving, setIsSaving] = useState(false)

  // When the image loads, centre a default crop
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget
      const initial = centerCrop(
        makeAspectCrop(
          { unit: "%", width: 90 },
          config.aspect,
          nw,
          nh,
        ),
        nw,
        nh,
      )
      setCrop(initial)
    },
    [config.aspect],
  )

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return
    setIsSaving(true)
    try {
      const blob = await getCroppedBlob(
        imgRef.current,
        completedCrop,
        config.outputWidth,
        config.outputHeight,
      )
      const ext = fileName.split(".").pop() ?? "jpg"
      const outName = fileName.replace(/\.[^.]+$/, `_cropped.${ext}`)
      const file = new File([blob], outName, { type: "image/jpeg" })
      onCrop(file)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent
        className="max-w-2xl w-full p-0 bg-card border border-border shadow-2xl overflow-hidden rounded-2xl"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border bg-muted/30">
          <DialogTitle className="text-base font-semibold text-foreground">
            Crop Image — {config.label}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{config.hint}</p>
        </DialogHeader>

        {/* Crop area */}
        <div className="flex items-center justify-center bg-black/90 min-h-[300px] max-h-[60vh] overflow-auto p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={config.aspect}
            minWidth={60}
            keepSelection
            className="max-w-full max-h-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxHeight: "55vh", objectFit: "contain" }}
              draggable={false}
            />
          </ReactCrop>
        </div>

        {/* Tip */}
        <div className="px-6 py-2 flex items-center gap-2 border-t border-border bg-muted/10">
          <ZoomIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Drag to reposition · Drag handles to resize · Aspect ratio is locked to {config.label}
          </p>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-5 pt-3 flex flex-row gap-2 justify-end bg-muted/20 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="h-9 px-4 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!completedCrop || isSaving}
            className="h-9 px-5 text-xs bg-primary text-primary-foreground font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <ZoomOut className="h-3.5 w-3.5 mr-1.5" />
                Apply Crop
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
