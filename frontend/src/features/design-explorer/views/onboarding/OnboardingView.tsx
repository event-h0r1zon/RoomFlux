import {
  Link2,
  LoaderCircle,
  // Sparkles
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
  } = useDesignExplorer()

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">
            Start Design Exploration
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
                      <div>
                        <p className="font-medium pl-2">
                          Session #{session.id.substring(0, 6)}
                        </p>
                        {session.workDate && (
                          <p className="text-xs text-muted-foreground pl-2">
                            {new Date(session.workDate).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
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
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={() => resumeSession(session.id)}
                        >
                          Resume this session
                        </Button>
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
  )
}
