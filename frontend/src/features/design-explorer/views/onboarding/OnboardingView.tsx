import { 
    Link2, 
    LoaderCircle, 
    // Sparkles 
} from "lucide-react"

// import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface OnboardingViewProps {
  propertyUrl: string
  status: string | null
  isScraping: boolean
  onPropertyUrlChange: (value: string) => void
  onStart: () => void
}

export function OnboardingView({
  propertyUrl,
  status,
  isScraping,
  onPropertyUrlChange,
  onStart,
}: OnboardingViewProps) {
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
                onChange={(event) => onPropertyUrlChange(event.target.value)}
                className="pr-12"
              />
              <Link2 className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2" />
            </div>
            {status && (
              <p className="text-sm text-muted-foreground">{status}</p>
            )}
          </div>

        </CardContent>
        <CardFooter className="justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onPropertyUrlChange("")}
            disabled={isScraping}
          >
            Clear
          </Button>
          <Button onClick={onStart} disabled={isScraping}>
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
