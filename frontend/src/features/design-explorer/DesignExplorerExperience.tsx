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
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
      <div className="pointer-events-none absolute -left-10 top-10 h-72 w-72 rounded-full bg-slate-300/30 blur-3xl dark:bg-slate-700/40" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/4 rounded-full bg-slate-200/40 blur-[140px] dark:bg-slate-800/40" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-multiply" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.35), transparent 1px)", backgroundSize: "120px 120px" }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.12), transparent 60%)", backgroundSize: "120px 120px" }}
      />
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16 lg:px-6">
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
