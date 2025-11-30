export type DesignExplorerView = "onboarding" | "gallery" | "editor"

export type ScrapedImage = {
  id: string
  title: string
  roomType: string
  description: string
  imageUrl: string
  tags: string[]
  viewId?: string
}

export type AssetItem = {
  id: string
  name: string
  imageUrl: string
}

export type ChatMessage = {
  id: string
  role: "user" | "asset"
  content: string
  createdAt: string
  assetName?: string
  assetUrl?: string
}

export type SavedSessionView = {
  id: string
  originalImage: string | null
  editedImages: string[]
  chatHistory: ChatMessage[]
  assets: AssetItem[]
}

export type SavedSession = {
  id: string
  workDate?: string | null
  views: SavedSessionView[]
}
