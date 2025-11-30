import type { DragEvent, FormEvent } from "react"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"

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

import type { AssetItem } from "../../lib/types"
import { useDesignExplorer } from "../../context/DesignExplorerContext"
import { AssetLibrary } from "./components/AssetLibrary.tsx"
import { CanvasStage } from "./components/CanvasStage.tsx"
import { ChatPanel } from "./components/ChatPanel.tsx"
import { toast } from "sonner"

const ASSET_TRANSFER_KEY = "design-explorer/asset"

export function EditorView() {
  const {
    selectedImage,
    assets,
    backToGallery,
    handleAssetDrop,
    addAsset,
    updateAsset,
    deleteAsset,
    chatHistory,
    sendChatMessage,
    isChatSubmitting,
    activeImageUrl,
    imageHistoryPosition,
    goToPreviousImage,
    goToNextImage,
    canDeleteLatestImage,
    deleteLatestImage,
    isDeletingLatestImage,
  } = useDesignExplorer()

  if (!selectedImage) {
    return null
  }

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

    const promise = handleAssetDrop(pendingAsset, trimmed)
    closeInstructionDialog()

    toast.promise(promise, {
      loading: `Queuing design update for ${pendingAsset.name}...`,
      success: `Design update for ${pendingAsset.name} queued!`,
      error: `Failed to queue design update for ${pendingAsset.name}.`,
    });
    
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
        <CanvasStage
          selectedImage={selectedImage}
          canvasImageKey={canvasImageKey}
          canvasImageUrl={canvasImageUrl}
          historyIndex={historyIndex}
          historyCount={historyCount}
          canStepBackward={canStepBackward}
          canStepForward={canStepForward}
          canDeleteLatestImage={canDeleteLatestImage}
          isDeletingLatestImage={isDeletingLatestImage}
          showHistoryControls={showHistoryControls}
          onPreviousImage={goToPreviousImage}
          onNextImage={goToNextImage}
          onDeleteLatestImage={deleteLatestImage}
          onDropAsset={handleDrop}
        />

        <div className="flex flex-col gap-4">
          <AssetLibrary
            assets={assets}
            dataTransferKey={ASSET_TRANSFER_KEY}
            onUploadAsset={addAsset}
            onUpdateAsset={updateAsset}
            onDeleteAsset={deleteAsset}
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
