import { useCallback, useEffect, useMemo, useState } from "react"

import { MOCK_SCRAPED_IMAGES } from "../data/mock-data"
import {
  appendChat,
  createSession,
  fetchSessions,
  scrapeImmoscout,
  uploadAsset as uploadAssetRequest,
  updateViewImage,
} from "../lib/api"
import type {
  AssetItem,
  ChatMessage,
  DesignExplorerView,
  SavedSession,
  ScrapedImage,
} from "../lib/types"

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

type ChatEntryRecord = Record<string, unknown>

type SessionViewApiRecord = {
  id: string
  original_image?: string | null
  edited_images?: string[]
  chat_history?: ChatEntryRecord[]
  asset_library?: Array<{ id: string; name: string; url: string }>
}

type SessionApiRecord = {
  id: string
  work_date?: string
  views?: SessionViewApiRecord[]
}

type ViewImageMeta = {
  original: string | null
  edited: string[]
}

const normalizeChatEntry = (entry: ChatEntryRecord): ChatMessage => {
  const createdAt =
    typeof entry.createdAt === "string"
      ? entry.createdAt
      : typeof entry.created_at === "string"
        ? entry.created_at
        : new Date().toISOString()

  const assetName =
    typeof entry.assetName === "string"
      ? entry.assetName
      : typeof entry.asset_name === "string"
        ? entry.asset_name
        : undefined

  const assetUrl =
    typeof entry.assetUrl === "string"
      ? entry.assetUrl
      : typeof entry.asset_url === "string"
        ? entry.asset_url
        : undefined

  return {
    id: typeof entry.id === "string" ? entry.id : makeId(),
    role: entry.role === "asset" ? "asset" : "user",
    content:
      typeof entry.content === "string"
        ? entry.content
        : String(entry.content ?? ""),
    createdAt,
    assetName,
    assetUrl,
  }
}

const normalizeChatHistory = (
  entries: ChatEntryRecord[] | undefined
): ChatMessage[] => (entries ?? []).map(normalizeChatEntry)

export function useDesignExplorerSession() {
  const [view, setView] = useState<DesignExplorerView>("onboarding")
  const [propertyUrl, setPropertyUrl] = useState("")
  const [images, setImages] = useState<ScrapedImage[]>(MOCK_SCRAPED_IMAGES)
  const [selectedImage, setSelectedImage] = useState<ScrapedImage | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [viewLookup, setViewLookup] = useState<Record<string, string>>({})
  const [viewChats, setViewChats] = useState<Record<string, ChatMessage[]>>({})
  const [viewAssets, setViewAssets] = useState<Record<string, AssetItem[]>>({})
  const [viewImages, setViewImages] = useState<Record<string, ViewImageMeta>>({})
  const [isChatSubmitting, setIsChatSubmitting] = useState(false)
  const [timeline, setTimeline] = useState<string[]>([])
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)

  const normalizeSavedView = useCallback(
    (viewRecord: SessionViewApiRecord): SavedSession["views"][number] => {
      const assets = (viewRecord.asset_library ?? []).map((asset) => ({
        id: asset.id,
        name: asset.name,
        imageUrl: asset.url,
      }))

      return {
        id: viewRecord.id,
        originalImage: viewRecord.original_image ?? null,
        editedImages: [...(viewRecord.edited_images ?? [])],
        chatHistory: normalizeChatHistory(viewRecord.chat_history),
        assets,
      }
    },
    []
  )

  const fetchSavedSessions = useCallback(async () => {
    setIsSessionsLoading(true)
    try {
      const response = await fetchSessions(6)
      const normalized: SavedSession[] = (response.sessions ?? []).map(
        (session: SessionApiRecord) => ({
          id: session.id,
          workDate: session.work_date ?? null,
          views: (session.views ?? []).map(normalizeSavedView),
        })
      )
      setSavedSessions(normalized)
    } catch (error) {
      console.error("Failed to load previous sessions", error)
    } finally {
      setIsSessionsLoading(false)
    }
  }, [normalizeSavedView])

  useEffect(() => {
    fetchSavedSessions()
  }, [fetchSavedSessions])

  const startScrape = useCallback(async () => {
    if (!propertyUrl.trim()) {
      setStatus("Please paste a valid Immoscout property URL.")
      return
    }

    setIsScraping(true)
    setStatus("Connecting to Immoscout...")

    try {
      const result = await scrapeImmoscout(propertyUrl)
      const session = await createSession({
        propertyUrl,
        views: result.map((image) => ({
          original_image: image.imageUrl,
          chat_history: [],
          edited_images: [],
        })),
      })

      const lookup: Record<string, string> = {}
      const viewImageMap: Record<string, ViewImageMeta> = {}
      const enhancedImages = result.map((image, index) => {
        const viewRecord = session.views[index]
        if (viewRecord?.id) {
          lookup[image.id] = viewRecord.id
          const original = viewRecord.original_image ?? image.imageUrl
          viewImageMap[viewRecord.id] = {
            original,
            edited: [],
          }
          return { ...image, viewId: viewRecord.id, imageUrl: original ?? image.imageUrl }
        }
        return image
      })

      setViewLookup(lookup)
      setViewImages(viewImageMap)
      setImages(enhancedImages)
      setViewChats({})
      setViewAssets({})
      setView("gallery")
      setStatus(null)
      fetchSavedSessions()
    } catch (error) {
      console.error(error)
      setStatus("Could not fetch the listing. Please try again.")
    } finally {
      setIsScraping(false)
    }
  }, [fetchSavedSessions, propertyUrl])

  const selectImage = useCallback((image: ScrapedImage) => {
    setSelectedImage(image)
    setView("editor")
  }, [])

  const backToGallery = useCallback(() => setView("gallery"), [])

  const resetExperience = useCallback(() => {
    setView("onboarding")
    setPropertyUrl("")
    setSelectedImage(null)
    setViewLookup({})
    setViewChats({})
    setViewAssets({})
    setViewImages({})
    setImages(MOCK_SCRAPED_IMAGES)
    setTimeline([])
    setStatus(null)
  }, [])

  const resumeSession = useCallback(
    (sessionId: string) => {
      const session = savedSessions.find((item) => item.id === sessionId)
      if (!session) {
        return
      }

      const lookup: Record<string, string> = {}
      const reconstructed: ScrapedImage[] = []
      const viewImageMap: Record<string, ViewImageMeta> = {}

      session.views.forEach((viewRecord, index) => {
        if (!viewRecord.originalImage) {
          return
        }
        const imageId = viewRecord.id || `${session.id}-view-${index}`
        if (viewRecord.id) {
          lookup[imageId] = viewRecord.id
          viewImageMap[viewRecord.id] = {
            original: viewRecord.originalImage,
            edited: [...viewRecord.editedImages],
          }
        }
        const latestImage =
          viewRecord.editedImages.length > 0
            ? viewRecord.editedImages[viewRecord.editedImages.length - 1]
            : viewRecord.originalImage
        reconstructed.push({
          id: imageId,
          title: `Session view ${index + 1}`,
          roomType: "Imported",
          description: "Loaded from saved session",
          imageUrl: latestImage ?? viewRecord.originalImage,
          tags: ["saved"],
          viewId: viewRecord.id,
        })
      })

      if (reconstructed.length === 0) {
        setStatus("Selected session has no reference imagery yet.")
        return
      }

      const chatsMap: Record<string, ChatMessage[]> = {}
      const assetsMap: Record<string, AssetItem[]> = {}
      session.views.forEach((viewRecord) => {
        if (!viewRecord.id) return
        chatsMap[viewRecord.id] = viewRecord.chatHistory
        assetsMap[viewRecord.id] = viewRecord.assets
      })

      setImages(reconstructed)
      setSelectedImage(null)
      setViewLookup(lookup)
      setViewChats(chatsMap)
      setViewAssets(assetsMap)
      setViewImages(viewImageMap)
      setTimeline([])
      setView("gallery")
      setStatus(null)
    },
    [savedSessions]
  )

  const captureTimeline = useCallback((entry: string) => {
    setTimeline((prev) => [entry, ...prev].slice(0, 6))
  }, [])

  const resolveViewId = useCallback(() => {
    if (!selectedImage) return null
    return selectedImage.viewId ?? viewLookup[selectedImage.id] ?? null
  }, [selectedImage, viewLookup])

  const getLatestImageUrl = useCallback(
    (targetViewId: string | null) => {
      if (!targetViewId) return null
      const entry = viewImages[targetViewId]
      if (!entry) return null
      const edits = entry.edited.filter(Boolean)
      if (edits.length > 0) {
        return edits[edits.length - 1]
      }
      return entry.original
    },
    [viewImages]
  )

  const applyEditedImage = useCallback(
    (viewId: string, nextUrl: string, fallbackOriginal?: string | null) => {
      setViewImages((prev) => {
        const current = prev[viewId] ?? {
          original: fallbackOriginal ?? null,
          edited: [],
        }
        return {
          ...prev,
          [viewId]: {
            original: current.original ?? fallbackOriginal ?? null,
            edited: [...current.edited, nextUrl],
          },
        }
      })

      setImages((prev) =>
        prev.map((image) => {
          const imageViewId = image.viewId ?? viewLookup[image.id]
          if (imageViewId === viewId) {
            return { ...image, imageUrl: nextUrl }
          }
          return image
        })
      )

      setSelectedImage((prev) => {
        if (!prev) return prev
        const prevViewId = prev.viewId ?? viewLookup[prev.id]
        if (prevViewId !== viewId) return prev
        return { ...prev, imageUrl: nextUrl }
      })
    },
    [setImages, setSelectedImage, viewLookup]
  )

  const handleAssetDrop = useCallback(
    async (asset: AssetItem, instructions: string) => {
      const viewId = resolveViewId()
      if (!viewId || !instructions) return

      try {
        const response = await appendChat(viewId, {
          role: "asset",
          message: instructions,
          assetName: asset.name,
          assetUrl: asset.imageUrl,
        })
        const history = normalizeChatHistory(response.chat_history)
        setViewChats((prev) => ({ ...prev, [viewId]: history }))
        captureTimeline(
          `${asset.name} queued · "${instructions.substring(0, 36)}"`
        )
      } catch (error) {
        console.error("Failed to append asset placement", error)
      }
    },
    [captureTimeline, resolveViewId]
  )

  const uploadAsset = useCallback(
    async (input: { name: string; file: File }) => {
      const viewId = resolveViewId()
      if (!viewId) return

      try {
        const response = await uploadAssetRequest(viewId, {
          name: input.name,
          file: input.file,
        })

        const assetRecord: AssetItem = {
          id: response.asset.id,
          name: response.asset.name,
          imageUrl: response.public_url,
        }

        setViewAssets((prev) => ({
          ...prev,
          [viewId]: [assetRecord, ...(prev[viewId] ?? [])],
        }))

        if (response.chat_entry) {
          const entry = normalizeChatEntry(response.chat_entry)
          setViewChats((prev) => ({
            ...prev,
            [viewId]: [...(prev[viewId] ?? []), entry],
          }))
        }

        captureTimeline(`Asset added · ${assetRecord.name}`)
      } catch (error) {
        console.error("Failed to upload asset", error)
        throw error
      }
    },
    [captureTimeline, resolveViewId]
  )

  const updateAsset = useCallback(
    (assetId: string, updates: Partial<Omit<AssetItem, "id">>) => {
      const viewId = resolveViewId()
      if (!viewId) return

      let updatedName: string | null = null
      setViewAssets((prev) => {
        const list = prev[viewId] ?? []
        const nextList = list.map((asset) => {
          if (asset.id !== assetId) return asset
          const next = { ...asset, ...updates }
          updatedName = next.name
          return next
        })
        return { ...prev, [viewId]: nextList }
      })

      if (updatedName) {
        captureTimeline(`Asset updated · ${updatedName}`)
      }
    },
    [captureTimeline, resolveViewId]
  )

  const sendChatMessage = useCallback(
    async (text: string) => {
      const viewId = resolveViewId()
      if (!viewId) return
      const trimmed = text.trim()
      if (!trimmed) return
      setIsChatSubmitting(true)

      try {
        const response = await appendChat(viewId, {
          role: "user",
          message: trimmed,
        })
        const history = normalizeChatHistory(response.chat_history)
        setViewChats((prev) => ({ ...prev, [viewId]: history }))
        captureTimeline(`Prompt sent · "${trimmed.substring(0, 36)}"`)

        const sourceImageUrl =
          getLatestImageUrl(viewId) ?? selectedImage?.imageUrl ?? null
        if (sourceImageUrl) {
          try {
            const generation = await updateViewImage(viewId, {
              prompt: trimmed,
              inputImage: sourceImageUrl,
            })
            const nextUrl = generation.data?.url
            if (nextUrl) {
              applyEditedImage(viewId, nextUrl, sourceImageUrl)
              fetchSavedSessions()
            }
          } catch (imageError) {
            console.error("Failed to update view image", imageError)
          }
        }
      } catch (error) {
        console.error("Failed to append chat", error)
      } finally {
        setIsChatSubmitting(false)
      }
    },
    [
      captureTimeline,
      resolveViewId,
      getLatestImageUrl,
      selectedImage,
      applyEditedImage,
      fetchSavedSessions,
    ]
  )

  const activeViewId = resolveViewId()
  const activeImageUrl = activeViewId
    ? getLatestImageUrl(activeViewId) ?? selectedImage?.imageUrl ?? null
    : null

  const assets = useMemo(
    () => (activeViewId ? viewAssets[activeViewId] ?? [] : []),
    [activeViewId, viewAssets]
  )

  const chatHistory = useMemo(
    () => (activeViewId ? viewChats[activeViewId] ?? [] : []),
    [activeViewId, viewChats]
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
    addAsset: uploadAsset,
    updateAsset,
    chatHistory,
    sendChatMessage,
    isChatSubmitting,
    timeline,
    savedSessions,
    isSessionsLoading,
    resumeSession,
    activeImageUrl,
  }
}
