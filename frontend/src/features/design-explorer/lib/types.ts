export type DesignExplorerView = "onboarding" | "gallery" | "editor"

export type ScrapedImage = {
  id: string
  title: string
  roomType: string
  description: string
  imageUrl: string
  tags: string[]
}

export type AssetItem = {
  id: string
  name: string
  imageUrl: string
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant" | "asset"
  content: string
  createdAt: Date
  assetName?: string
}
