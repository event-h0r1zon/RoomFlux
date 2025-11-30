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
import { cn } from "@/lib/utils"

import type {
  AssetItem,
  ChatMessage,
  ScrapedImage,
} from "../../lib/types"
import { AssetLibrary } from "./components/AssetLibrary.tsx"
import { ChatPanel } from "./components/ChatPanel.tsx"

const ASSET_TRANSFER_KEY = "design-explorer/asset"

interface EditorViewProps {
  image: ScrapedImage
  assets: AssetItem[]
  onBack: () => void
  onAssetDrop: (asset: AssetItem, instructions: string) => Promise<void>
  onUploadAsset: (asset: Omit<AssetItem, "id">) => void
  onUpdateAsset: (
    assetId: string,
    updates: Partial<Omit<AssetItem, "id">>
  ) => void
  chatHistory: ChatMessage[]
  onSendChat: (value: string) => Promise<void>
  isChatSubmitting: boolean
  timeline: string[]
}

export function EditorView({
  image,
  assets,
  onBack,
  onAssetDrop,
  onUploadAsset,
  onUpdateAsset,
  chatHistory,
  onSendChat,
  isChatSubmitting,
//   timeline,
}: EditorViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [instructionDialogOpen, setInstructionDialogOpen] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<AssetItem | null>(null)
  const [placementNotes, setPlacementNotes] = useState("")

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
    await onAssetDrop(pendingAsset, trimmed)
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
        <Button variant="ghost" size="sm" onClick={onBack}>
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
          <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl bg-background shadow-inner">
            <img
              key={image.id}
              src={image.imageUrl}
              alt={image.title}
              className="h-full max-h-[600px] w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <AssetLibrary
            assets={assets}
            dataTransferKey={ASSET_TRANSFER_KEY}
            onUploadAsset={onUploadAsset}
            onUpdateAsset={onUpdateAsset}
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
            onSend={onSendChat}
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
