"use client"

/**
 * useImageCrop
 * ─────────────
 * Manages the state for the ImageCropModal so individual upload
 * components don't need to repeat the same open/close/src logic.
 *
 * Usage:
 *   const { cropState, openCrop, closeCrop } = useImageCrop()
 *
 *   // Open crop for a user-selected file:
 *   openCrop(file, "poster", (croppedFile) => uploadFile(croppedFile))
 *
 *   // Render (alongside your existing JSX):
 *   {cropState.open && (
 *     <ImageCropModal
 *       src={cropState.src}
 *       ratio={cropState.ratio}
 *       fileName={cropState.fileName}
 *       onCrop={cropState.onCrop}
 *       onCancel={closeCrop}
 *     />
 *   )}
 */

import { useState, useCallback } from "react"
import type { CropRatio } from "@/components/ui/ImageCropModal"

interface CropState {
  open: boolean
  src: string
  ratio: CropRatio
  fileName: string
  onCrop: (file: File) => void
}

const DEFAULT_STATE: CropState = {
  open: false,
  src: "",
  ratio: "poster",
  fileName: "image.jpg",
  onCrop: () => {},
}

export function useImageCrop() {
  const [cropState, setCropState] = useState<CropState>(DEFAULT_STATE)

  const openCrop = useCallback(
    (file: File, ratio: CropRatio, onCrop: (cropped: File) => void) => {
      const src = URL.createObjectURL(file)
      setCropState({ open: true, src, ratio, fileName: file.name, onCrop })
    },
    [],
  )

  const closeCrop = useCallback(() => {
    // Revoke the object URL to avoid memory leaks
    setCropState((prev) => {
      if (prev.src && prev.src.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(prev.src)
        } catch (e) {
          console.error("Error revoking crop object URL:", e)
        }
      }
      return DEFAULT_STATE
    })
  }, [])

  return { cropState, openCrop, closeCrop }
}
