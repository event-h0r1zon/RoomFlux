import { useCallback, useState } from "react"

import { MOCK_SCRAPED_IMAGES } from "../data/mock-data"
import {
  generateWithAsset,
  generateWithPrompt,
  scrapeImmoscout,
} from "../lib/api"
import type {
  AssetItem,
  ChatMessage,
  DesignExplorerView,
  ScrapedImage,
} from "../lib/types"

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export function useDesignExplorerSession() {
  const [view, setView] = useState<DesignExplorerView>("onboarding")
  const [propertyUrl, setPropertyUrl] = useState("")
  const [images, setImages] = useState<ScrapedImage[]>(MOCK_SCRAPED_IMAGES)
  const [selectedImage, setSelectedImage] = useState<ScrapedImage | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isChatSubmitting, setIsChatSubmitting] = useState(false)
  const [timeline, setTimeline] = useState<string[]>([])
  const [assets, setAssets] = useState<AssetItem[]>([])

  const startScrape = useCallback(async () => {
    if (!propertyUrl.trim()) {
      setStatus("Please paste a valid Immoscout property URL.")
      return
    }

    setIsScraping(true)
    setStatus("Connecting to Immoscout...")

    try {
      const result = await scrapeImmoscout(propertyUrl)
      setImages(result)
      setView("gallery")
      setStatus(null)
    } catch (error) {
      console.error(error)
      setStatus("Could not fetch the listing. Please try again.")
    } finally {
      setIsScraping(false)
    }
  }, [propertyUrl])

  const selectImage = useCallback((image: ScrapedImage) => {
    setSelectedImage(image)
    setView("editor")
  }, [])

  const backToGallery = useCallback(() => setView("gallery"), [])

  const resetExperience = useCallback(() => {
    setView("onboarding")
    setPropertyUrl("")
    setSelectedImage(null)
    setChatHistory([])
    setTimeline([])
    setAssets([])
    setStatus(null)
  }, [])

  const captureTimeline = useCallback((entry: string) => {
    setTimeline((prev) => [entry, ...prev].slice(0, 6))
  }, [])

  const handleAssetDrop = useCallback(
    async (asset: AssetItem, instructions: string) => {
      if (!selectedImage || !instructions) return
      await generateWithAsset(selectedImage, asset.id, instructions)
      captureTimeline(
        `${asset.name} queued · "${instructions.substring(0, 36)}"`
      )
    },
    [captureTimeline, selectedImage]
  )

  const addAsset = useCallback((asset: Omit<AssetItem, "id">) => {
    setAssets((prev) => [{ id: makeId(), ...asset }, ...prev])
    captureTimeline(`Asset added · ${asset.name}`)
  }, [captureTimeline])

  const sendChatMessage = useCallback(
    async (text: string) => {
      if (!selectedImage) return
      const trimmed = text.trim()
      if (!trimmed) return

      const userMessage: ChatMessage = {
        id: makeId(),
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      }
      setChatHistory((prev) => [...prev, userMessage])
      setIsChatSubmitting(true)

      try {
        const assistantContent = await generateWithPrompt(selectedImage, trimmed)
        const assistantMessage: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: assistantContent,
          createdAt: new Date(),
        }
        setChatHistory((prev) => [...prev, assistantMessage])
        captureTimeline(`Prompt sent · "${trimmed.substring(0, 36)}"`)
      } finally {
        setIsChatSubmitting(false)
      }
    },
    [captureTimeline, selectedImage]
  )

  return {
    view,
    propertyUrl,
    setPropertyUrl,
    startScrape,
    isScraping,
    status,
    images,
    selectImage,
    selectedImage,
    backToGallery,
    resetExperience,
    assets,
    handleAssetDrop,
    addAsset,
    chatHistory,
    sendChatMessage,
    isChatSubmitting,
    timeline,
  }
}
