import type { DragEvent, FormEvent } from "react"
import { useState } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { AssetItem } from "../../lib/types"
import { useDesignExplorer } from "../../context/DesignExplorerContext"
import { AssetLibrary } from "./components/AssetLibrary.tsx"
import { ChatPanel } from "./components/ChatPanel.tsx"

const ASSET_TRANSFER_KEY = "design-explorer/asset"

export function EditorView() {
  const {
    selectedImage,
    assets,
    backToGallery,
    handleAssetDrop,
    addAsset,
    updateAsset,
    chatHistory,
    sendChatMessage,
    isChatSubmitting,
    activeImageUrl,
    imageHistoryPosition,
    goToPreviousImage,
    goToNextImage,
  } = useDesignExplorer()

  if (!selectedImage) {
    return null
  }

  const [isDragOver, setIsDragOver] = useState(false)
  const [instructionDialogOpen, setInstructionDialogOpen] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<AssetItem | null>(null)
  const [placementNotes, setPlacementNotes] = useState("")
  const historyIndex = imageHistoryPosition.index
  const historyCount = imageHistoryPosition.count
  const canStepBackward = historyCount > 0 && historyIndex > 0
  const canStepForward = historyCount > 0 && historyIndex < historyCount - 1
  const showHistoryControls = historyCount > 1
  const canvasImageUrl = activeImageUrl ?? selectedImage.imageUrl
  const canvasImageKey = `${selectedImage.id}-${historyIndex}`

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const assetId = event.dataTransfer.getData(ASSET_TRANSFER_KEY)
    const asset = assets.find((item) => item.id === assetId)
    if (!asset) return
    setPendingAsset(asset)
    setPlacementNotes("")
    setInstructionDialogOpen(true)
  }

  const closeInstructionDialog = () => {
    setInstructionDialogOpen(false)
    setPendingAsset(null)
    setPlacementNotes("")
  }

  const handlePlacementSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingAsset) return
    const trimmed = placementNotes.trim()
    if (!trimmed) return
    await handleAssetDrop(pendingAsset, trimmed)
    closeInstructionDialog()
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Editor View
          </p>
          <h2 className="text-2xl font-semibold">Design canvas</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={backToGallery}>
          <ArrowLeft className="mr-2 size-4" /> Back to gallery
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div
          className={cn(
            "relative min-h-[460px] rounded-3xl border bg-muted/40 p-4",
            "transition-all duration-200",
            isDragOver &&
              "border-dashed border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(14,165,233,.3)]"
          )}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {showHistoryControls && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="pointer-events-auto rounded-full shadow"
                  onClick={goToPreviousImage}
                  disabled={!canStepBackward}
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="pointer-events-auto rounded-full shadow"
                  onClick={goToNextImage}
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

        <div className="flex flex-col gap-4">
          <AssetLibrary
            assets={assets}
            dataTransferKey={ASSET_TRANSFER_KEY}
            onUploadAsset={addAsset}
            onUpdateAsset={updateAsset}
          />

          {/* <Card className="h-44">
            <CardHeader className="py-4">
              <CardTitle className="text-base">Activity</CardTitle>
              <CardDescription>Latest design intents</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="py-0">
              <ScrollArea className="h-24 px-0">
                <ul className="divide-y">
                  {timeline.length === 0 && (
                    <li className="py-3 text-sm text-muted-foreground">
                      No events yet. Drop an asset or send a prompt to see the
                      queue.
                    </li>
                  )}
                  {timeline.map((entry, index) => (
                    <li key={entry + index} className="py-2 text-sm">
                      {entry}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card> */}

          <ChatPanel
            messages={chatHistory}
            onSend={sendChatMessage}
            isSending={isChatSubmitting}
          />
        </div>
      </div>

      <Dialog open={instructionDialogOpen} onOpenChange={(open) => {
        if (!open) {
          closeInstructionDialog()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAsset ? `Place ${pendingAsset.name}` : "Place asset"}
            </DialogTitle>
            <DialogDescription>
              Describe how this asset should be positioned or modified in the
              current scene.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handlePlacementSubmit}>
            <Textarea
              placeholder="e.g. place near the window with a soft shadow"
              value={placementNotes}
              onChange={(event) => setPlacementNotes(event.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={closeInstructionDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!placementNotes.trim()}>
                Queue design update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
