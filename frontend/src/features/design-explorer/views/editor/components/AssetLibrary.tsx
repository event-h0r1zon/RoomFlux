import type { ChangeEvent, FormEvent } from "react"
import { useState } from "react"
import { ImagePlus, Pencil, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { AssetItem } from "../../../lib/types"

interface AssetLibraryProps {
  assets: AssetItem[]
  dataTransferKey: string
  onUploadAsset: (input: { name: string; file: File }) => Promise<void>
  onUpdateAsset: (
    assetId: string,
    updates: { name?: string; file?: File }
  ) => Promise<void>
  onDeleteAsset: (assetId: string) => Promise<void>
}

export function AssetLibrary({
  assets,
  dataTransferKey,
  onUploadAsset,
  onUpdateAsset,
  onDeleteAsset,
}: AssetLibraryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [assetName, setAssetName] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [assetFile, setAssetFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const [editFile, setEditFile] = useState<File | null>(null)
  const [deleteDialogAsset, setDeleteDialogAsset] = useState<AssetItem | null>(null)
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const resetDialog = () => {
    setAssetName("")
    setPreview(null)
    setAssetFile(null)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingAsset(null)
    setEditName("")
    setEditPreview(null)
    setEditFile(null)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPreview(null)
      setAssetFile(null)
      return
    }

    setAssetFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = assetName.trim()
    if (!trimmed || !preview || !assetFile) return
    setIsUploading(true)
    try {
      await onUploadAsset({ name: trimmed, file: assetFile })
      resetDialog()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Failed to upload asset", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setEditPreview(editingAsset?.imageUrl ?? null)
      setEditFile(null)
      return
    }

    setEditFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setEditPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingAsset) return
    const trimmed = editName.trim()
    if (!trimmed) return

    setIsSavingEdit(true)
    try {
      await onUpdateAsset(editingAsset.id, {
        name: trimmed,
        file: editFile ?? undefined,
      })
      closeEditDialog()
    } catch (error) {
      console.error("Failed to update asset", error)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const openEditDialog = (asset: AssetItem) => {
    setEditingAsset(asset)
    setEditName(asset.name)
    setEditPreview(asset.imageUrl)
    setEditFile(null)
    setIsEditDialogOpen(true)
  }

  const handleDeleteAsset = async () => {
    if (!deleteDialogAsset) return
    const assetId = deleteDialogAsset.id
    setDeletingAssetId(assetId)
    try {
      await onDeleteAsset(assetId)
      setDeleteDialogAsset(null)
    } catch (error) {
      console.error("Failed to delete asset", error)
    } finally {
      setDeletingAssetId(null)
    }
  }

  return (
    <>
      <Card className="h-full">
      <CardHeader className="py-4">
        <CardTitle className="text-base">Asset Library</CardTitle>
        <CardDescription>
          Upload reference assets and drag them into the canvas to iterate.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-3">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            resetDialog()
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="w-full justify-start">
              <Upload className="mr-2 size-4" />
              Upload custom asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload design asset</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset name</Label>
                <Input
                  id="asset-name"
                  placeholder="e.g. Linen Sofa"
                  value={assetName}
                  onChange={(event) => setAssetName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-image">Asset image</Label>
                <Input
                  id="asset-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {preview && (
                  <div className="rounded-lg border bg-muted/30 p-2">
                    <img
                      src={preview}
                      alt="Asset preview"
                      className="h-32 w-full rounded-md object-cover"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetDialog()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!assetName.trim() || !preview || isUploading}
                >
                  {isUploading ? "Uploading" : "Save asset"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <div className="rounded-2xl border bg-muted/30 p-3">
          <ScrollArea className="max-h-64 pr-2">
            <div className="space-y-2">
              {assets.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
                  <ImagePlus className="size-4" />
                  Upload an asset to get started.
                </div>
              )}
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(dataTransferKey, asset.id)
                    event.dataTransfer.effectAllowed = "copy"
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border bg-background px-3 py-2 text-left text-sm transition-all hover:border-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="size-12 rounded-lg object-cover"
                    />
                    <span className="font-semibold">{asset.name}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        openEditDialog(asset)
                      }}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit {asset.name}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        setDeleteDialogAsset(asset)
                      }}
                      disabled={deletingAssetId === asset.id}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete {asset.name}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      </Card>
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? `Edit ${editingAsset.name}` : "Edit asset"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-name">Asset name</Label>
              <Input
                id="edit-asset-name"
                placeholder="e.g. Linen Sofa"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-asset-image">Asset image</Label>
              <Input
                id="edit-asset-image"
                type="file"
                accept="image/*"
                onChange={handleEditFileChange}
              />
              {editPreview && (
                <div className="rounded-lg border bg-muted/30 p-2">
                  <img
                    src={editPreview}
                    alt="Asset preview"
                    className="h-32 w-full rounded-md object-cover"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={!editName.trim() || isSavingEdit}>
                {isSavingEdit ? "Saving" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteDialogAsset)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogAsset(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete asset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteDialogAsset
              ? `Remove ${deleteDialogAsset.name} from this view? This action cannot be undone.`
              : "Remove this asset?"}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteDialogAsset(null)}
              disabled={Boolean(deletingAssetId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAsset}
              disabled={Boolean(deletingAssetId)}
            >
              {deletingAssetId ? "Deleting" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
