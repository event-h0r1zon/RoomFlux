import type { DragEvent } from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { ScrapedImage } from "../../../lib/types"

interface CanvasStageProps {
  selectedImage: ScrapedImage
  canvasImageKey: string
  canvasImageUrl: string
  historyIndex: number
  historyCount: number
  canStepBackward: boolean
  canStepForward: boolean
  canDeleteLatestImage: boolean
  isDeletingLatestImage: boolean
  showHistoryControls: boolean
  onPreviousImage: () => void
  onNextImage: () => void
  onDeleteLatestImage: () => void
  onDropAsset: (event: DragEvent<HTMLDivElement>) => void
}

export function CanvasStage({
  selectedImage,
  canvasImageKey,
  canvasImageUrl,
  historyIndex,
  historyCount,
  canStepBackward,
  canStepForward,
  canDeleteLatestImage,
  isDeletingLatestImage,
  showHistoryControls,
  onPreviousImage,
  onNextImage,
  onDeleteLatestImage,
  onDropAsset,
}: CanvasStageProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    onDropAsset(event)
  }

  return (
    <div
      className={cn(
        "relative min-h-[460px] rounded-3xl border bg-muted/40 p-6",
        "transition-all duration-200",
        isDragOver &&
          "border-dashed border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(14,165,233,.3)]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="absolute left-1/2 bottom-20 -translate-x-1/2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          size="sm"
          onClick={onDeleteLatestImage}
          disabled={!canDeleteLatestImage || isDeletingLatestImage}
        >
          <Trash2 className="mr-2 size-4" />
          {isDeletingLatestImage ? "Deleting" : "Delete"}
        </Button>
      </div>

      {showHistoryControls && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-10">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full shadow"
              onClick={onPreviousImage}
              disabled={!canStepBackward}
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-10">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="pointer-events-auto rounded-full shadow"
              onClick={onNextImage}
              disabled={!canStepForward}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="pointer-events-none absolute left-1/2 top-15 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow">
            Image {historyIndex + 1} / {historyCount}
          </div>
        </>
      )}

      <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl bg-background shadow-inner">
        <img
          key={canvasImageKey}
          src={canvasImageUrl}
          alt={selectedImage.title}
          className="h-full max-h-[600px] w-full object-cover"
        />
      </div>
    </div>
  )
}
