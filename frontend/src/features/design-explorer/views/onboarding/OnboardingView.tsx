import { useState } from "react"

import {
  Link2,
  LoaderCircle,
  Play,
  Trash2,
  Sparkles,
} from "lucide-react"

// import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDesignExplorer } from "../../context/DesignExplorerContext"

export function OnboardingView() {
  const {
    propertyUrl,
    status,
    isScraping,
    setPropertyUrl,
    startScrape,
    savedSessions,
    isSessionsLoading,
    resumeSession,
    deleteSession,
  } = useDesignExplorer()

  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; label: string } | null>(null)
  const [isDeletingSession, setIsDeletingSession] = useState(false)

  const formatSessionLabel = (workDate?: string | null) => {
    if (!workDate) {
      return "Recent workspace"
    }
    const date = new Date(workDate)
    if (Number.isNaN(date.getTime())) {
      return "Recent workspace"
    }
    const dayLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(date)
    const timeLabel = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
    return `${timeLabel} · ${dayLabel}`
  }

  const formatSessionMeta = (sessionId: string, viewCount: number) => {
    const viewLabel = viewCount === 1 ? "view" : "views"
    return `${viewCount} ${viewLabel} saved · #${sessionId.slice(0, 6)}`
  }

  const openDeleteDialog = (sessionId: string, label: string) => {
    setSessionToDelete({ id: sessionId, label })
  }

  const closeDeleteDialog = () => {
    if (isDeletingSession) return
    setSessionToDelete(null)
  }

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return
    setIsDeletingSession(true)
    try {
      await deleteSession(sessionToDelete.id)
      setSessionToDelete(null)
    } catch (error) {
      console.error("Failed to delete session", error)
    } finally {
      setIsDeletingSession(false)
    }
  }

  return (
    <section className="relative isolate flex min-h-[70vh] w-full justify-center px-16e py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/90 via-slate-50/80 to-slate-200/60 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-950" />
      <div className="pointer-events-none absolute -top-24 right-6 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/20" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/4 rounded-full bg-slate-300/30 blur-[140px] dark:bg-slate-800/30" />


      <div className="relative z-10 grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_minmax(0,1fr)]">
        <div className="space-y-6 text-slate-900 dark:text-slate-100">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500 backdrop-blur dark:border-white/20 dark:bg-white/5">
            RoomFlux
            <Sparkles className="size-4 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Rooms flow. Ideas follow.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            A single property link becomes a living space ready when inspiration strikes.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-300">
            <span className="rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 backdrop-blur dark:border-white/10 dark:bg-white/5">
              Real houses
            </span>
            <span className="rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 backdrop-blur dark:border-white/10 dark:bg-white/5">
              Your Imagination
            </span>
          </div>
        </div>

        <Card className="w-full border border-white/60 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-3xl">
              Start Your Design Exploration
            </CardTitle>
            <CardDescription>
              Paste an Immoscout property URL and we will fetch the relevant images so
              you can ideate instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="property-url" className="text-base">
                Immoscout property link
              </Label>
              <div className="relative">
                <Input
                  id="property-url"
                  placeholder="https://www.immoscout24.de/expose/..."
                  value={propertyUrl}
                  onChange={(event) => setPropertyUrl(event.target.value)}
                  className="pr-12"
                />
                <Link2 className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
              </div>
              {status && (
                <p className="text-sm text-muted-foreground">{status}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Previously used sessions</Label>
                {isSessionsLoading && (
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {savedSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Once you begin iterating, your recent sessions will appear here for
                  quick access.
                </p>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  className="rounded-2xl border bg-muted/40 px-2"
                >
                  {savedSessions.map((session) => (
                    <AccordionItem value={session.id} key={session.id}>
                      <AccordionTrigger className="text-left">
                        <div className="pl-2">
                          <p className="font-medium">
                            {formatSessionLabel(session.workDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSessionMeta(session.id, session.views.length)}
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background/80 p-3">
                            <div>
                              <p className="text-sm font-medium">Workspace actions</p>
                              <p className="text-xs text-muted-foreground">
                                Resume where you left off or remove this session entirely.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => resumeSession(session.id)}>
                                <Play className="mr-2 size-4" /> Resume session
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() =>
                                  openDeleteDialog(session.id, formatSessionLabel(session.workDate))
                                }
                              >
                                <Trash2 className="mr-2 size-4" /> Delete session
                              </Button>
                            </div>
                          </div>
                          {session.views.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No views saved for this session yet.
                            </p>
                          )}
                          {session.views.map((view, index) => (
                            <div
                              key={`${session.id}-${view.id}`}
                              className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-14 overflow-hidden rounded-lg bg-muted">
                                  {view.originalImage ? (
                                    <img
                                      src={view.originalImage}
                                      alt={`View ${index + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">
                                    View {index + 1}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {view.chatHistory.length} notes · {view.assets.length} assets
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => resumeSession(session.id, view.id)}
                              >
                                <Play className="mr-2 size-4" /> Resume
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setPropertyUrl("")}
              disabled={isScraping}
            >
              Clear
            </Button>
            <Button onClick={startScrape} disabled={isScraping}>
              {isScraping ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Preparing
                </span>
              ) : (
                "Start"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete session</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {sessionToDelete
              ? `Remove "${sessionToDelete.label}" and all associated views? This cannot be undone.`
              : "Remove this saved session?"}
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDeleteDialog} disabled={isDeletingSession}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingSession}
              onClick={handleDeleteSession}
            >
              {isDeletingSession ? "Deleting" : "Delete session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
