import type { FormEvent } from "react"
import { useState } from "react"
import { MessageSquareText, Send } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { ChatMessage } from "../../../lib/types"

interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (value: string) => Promise<void>
  isSending: boolean
}

export function ChatPanel({ messages, onSend, isSending }: ChatPanelProps) {
  const [input, setInput] = useState("")

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!input.trim()) return
    await onSend(input)
    setInput("")
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="py-4">
        <CardTitle className="text-base">Design Assistant</CardTitle>
        <CardDescription>
          Describe changes in natural language and they will be queued for
          generation.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-hidden px-0 pb-0 pt-4">
        <ScrollArea className="h-48 px-6">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                <MessageSquareText className="size-4" />
                No design directions yet.
              </div>
            )}
            {messages.map((message) => {
              const isAsset = message.role === "asset"
              const timestamp = new Date(message.createdAt)
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 text-sm",
                    message.role === "user" && "flex-row-reverse text-right"
                  )}
                >
                  <Avatar className="size-8">
                    <AvatarFallback>
                      {isAsset ? "A" : "You"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {isAsset ? message.assetName ?? "Asset" : "You"}
                    </p>
                    {!Number.isNaN(timestamp.getTime()) && (
                      <p className="text-muted-foreground text-xs">
                        {timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <p className="mt-1 leading-relaxed">
                      {isAsset
                        ? `Placement note: ${message.content}`
                        : message.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
      <Separator />
      <CardFooter>
        <form className="w-full space-y-3" onSubmit={handleSubmit}>
          <Textarea
            placeholder="e.g. open up the living room with lighter wood and a softer rug"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isSending}
          />
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={isSending}>
              <Send className="mr-2 size-4" />
              {isSending ? "Queueing" : "Queue design change"}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  )
}
