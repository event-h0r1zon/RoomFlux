import { ArrowLeft, ImagePlus } from "lucide-react"

// import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  // CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { useDesignExplorer } from "../../context/DesignExplorerContext"

export function GalleryView() {
  const { images, selectImage, resetExperience } = useDesignExplorer()
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Gallery View
          </p>
          <h2 className="text-2xl font-semibold">Scraped references</h2>
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
                size="sm"
                variant="secondary"
                className="absolute bottom-3 right-3 shadow-md"
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
    </section>
  )
}
