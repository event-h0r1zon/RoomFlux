// import { Sparkles } from "lucide-react"

// import { Badge } from "@/components/ui/badge"
// import { Card } from "@/components/ui/card"

import { DesignExplorerProvider, useDesignExplorer } from "./context/DesignExplorerContext"
import { EditorView } from "./views/editor/EditorView"
import { GalleryView } from "./views/gallery/GalleryView"
import { OnboardingView } from "./views/onboarding/OnboardingView"

function ExperienceContent() {
  const { view, selectedImage } = useDesignExplorer()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/60">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:px-6">
        {/* <Card className="border-primary/20 bg-card/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-2">
                <Sparkles className="mr-2 size-4" /> AI Design Studio
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight">
                Interior Design Explorer
              </h1>
              <p className="text-muted-foreground mt-1 max-w-2xl">
                Move through rooms of your chosen property, upload assets, and get AI generated design suggestions in seconds to see if it fits your style.
              </p>
            </div>
          </div>
        </Card> */}

        {view === "onboarding" && <OnboardingView />}

        {view === "gallery" && <GalleryView />}

        {view === "editor" && selectedImage && <EditorView />}
      </main>
    </div>
  )
}

export function DesignExplorerExperience() {
  return (
    <DesignExplorerProvider>
      <ExperienceContent />
    </DesignExplorerProvider>
  )
}
