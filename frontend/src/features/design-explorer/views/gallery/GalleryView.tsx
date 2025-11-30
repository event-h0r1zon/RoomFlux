import { type MouseEvent, useState } from "react"

import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react"

// import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  // CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useDesignExplorer } from "../../context/DesignExplorerContext"

export function GalleryView() {
  const { images, selectImage, resetExperience, deleteView } = useDesignExplorer()
  const [viewToDelete, setViewToDelete] = useState<{ viewId: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const openDeleteDialog = (
    event: MouseEvent,
    options: { viewId?: string; title?: string }
  ) => {
    event.stopPropagation()
    if (!options.viewId) return
    setViewToDelete({ viewId: options.viewId, title: options.title ?? "Selected view" })
  }

  const closeDeleteDialog = () => {
    if (isDeleting) return
    setViewToDelete(null)
  }

  const handleDeleteView = async () => {
    if (!viewToDelete) return
    setIsDeleting(true)
    try {
      await deleteView(viewToDelete.viewId)
      setViewToDelete(null)
    } catch (error) {
      console.error("Failed to delete view", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Gallery View
          </p>
          <h2 className="text-2xl font-semibold">Scraped References</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={resetExperience}>
          <ArrowLeft className="mr-2 size-4" /> Reset flow
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {images.map((image) => (
          <Card
            key={image.id}
            className="group cursor-pointer overflow-hidden transition-colors hover:border-ring"
            onClick={() => selectImage(image)}
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              <img
                src={image.imageUrl}
                alt={image.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-3 top-3 rounded-full bg-background/80 text-destructive shadow-md hover:bg-background"
                onClick={(event) =>
                  openDeleteDialog(event, { viewId: image.viewId, title: image.title })
                }
                disabled={!image.viewId}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete view</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-3 right-3 shadow-md"
                onClick={(event) => {
                  event.stopPropagation()
                  selectImage(image)
                }}
              >
                <ImagePlus className="mr-2 size-4" />
                Edit
              </Button>
            </div>
            <CardHeader className="space-y-1">
              <CardTitle>{image.title}</CardTitle>
              <CardDescription>{image.description}</CardDescription>
            </CardHeader>
            {/* <CardContent>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent> */}
          </Card>
        ))}
      </div>

      <Dialog
        open={Boolean(viewToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete view</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {viewToDelete
              ? `Remove "${viewToDelete.title}" from this session? This action cannot be undone.`
              : "Remove this view?"}
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteView}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting" : "Delete view"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
