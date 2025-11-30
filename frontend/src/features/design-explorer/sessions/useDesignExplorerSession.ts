import { useCallback, useEffect, useMemo, useState } from "react"

import { MOCK_SCRAPED_IMAGES } from "../data/mock-data"
import {
  appendChat,
  createSession,
  fetchSessions,
  scrapeImmoscout,
  uploadAsset as uploadAssetRequest,
  updateViewImage,
  revertViewImage,
  deleteAsset as deleteAssetRequest,
  deleteView as deleteViewRequest,
  deleteSession as deleteSessionRequest,
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
  const [viewImageIndices, setViewImageIndices] = useState<Record<string, number>>({})
  const [isChatSubmitting, setIsChatSubmitting] = useState(false)
  const [isRevertingImage, setIsRevertingImage] = useState(false)
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
      const indexMap: Record<string, number> = {}
      const enhancedImages = result.map((image, index) => {
        const viewRecord = session.views[index]
        if (viewRecord?.id) {
          lookup[image.id] = viewRecord.id
          const original = viewRecord.original_image ?? image.imageUrl
          viewImageMap[viewRecord.id] = {
            original,
            edited: [],
          }
          const listLength = original ? 1 : 0
          indexMap[viewRecord.id] = Math.max(0, listLength - 1)
          return { ...image, viewId: viewRecord.id, imageUrl: original ?? image.imageUrl }
        }
        return image
      })

      setViewLookup(lookup)
      setViewImages(viewImageMap)
      setViewImageIndices(indexMap)
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
    setViewImageIndices({})
    setImages(MOCK_SCRAPED_IMAGES)
    setTimeline([])
    setStatus(null)
  }, [])

  const resumeSession = useCallback(
    (sessionId: string, targetViewId?: string) => {
      const session = savedSessions.find((item) => item.id === sessionId)
      if (!session) {
        return
      }

      const lookup: Record<string, string> = {}
      const reconstructed: ScrapedImage[] = []
      const viewImageMap: Record<string, ViewImageMeta> = {}
      const indexMap: Record<string, number> = {}

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
          const totalLength =
            (viewRecord.originalImage ? 1 : 0) + viewRecord.editedImages.length
          indexMap[viewRecord.id] = Math.max(0, totalLength - 1)
        }
        const latestImage =
          viewRecord.editedImages.length > 0
            ? viewRecord.editedImages[viewRecord.editedImages.length - 1]
            : viewRecord.originalImage
        const reconstructedEntry: ScrapedImage = {
          id: imageId,
          title: `Session view ${index + 1}`,
          roomType: "Imported",
          description: "Loaded from saved session",
          imageUrl: latestImage ?? viewRecord.originalImage,
          tags: ["saved"],
          viewId: viewRecord.id,
        }
        reconstructed.push(reconstructedEntry)
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

      const targetedImage = targetViewId
        ? reconstructed.find((image) => (image.viewId ?? lookup[image.id]) === targetViewId) ?? null
        : null
      const nextView = targetedImage ? "editor" : "gallery"

      setImages(reconstructed)
      setSelectedImage(targetedImage)
      setViewLookup(lookup)
      setViewChats(chatsMap)
      setViewAssets(assetsMap)
      setViewImages(viewImageMap)
      setViewImageIndices(indexMap)
      setTimeline([])
      setView(nextView)
      setStatus(null)
    },
    [savedSessions]
  )

  const captureTimeline = useCallback((entry: string) => {
    setTimeline((prev) => [entry, ...prev].slice(0, 6))
  }, [])

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return
      try {
        await deleteSessionRequest(sessionId)
        setSavedSessions((prev) => prev.filter((session) => session.id !== sessionId))
        captureTimeline(`Session deleted · ${sessionId.slice(0, 6)}`)
        await fetchSavedSessions()
      } catch (error) {
        console.error("Failed to delete session", error)
        throw error
      }
    },
    [captureTimeline, fetchSavedSessions]
  )

  const resolveViewId = useCallback(() => {
    if (!selectedImage) return null
    return selectedImage.viewId ?? viewLookup[selectedImage.id] ?? null
  }, [selectedImage, viewLookup])

  const getImageSequence = useCallback(
    (targetViewId: string | null) => {
      if (!targetViewId) return []
      const entry = viewImages[targetViewId]
      if (!entry) return []
      const sequence: string[] = []
      if (entry.original) {
        sequence.push(entry.original)
      }
      return [...sequence, ...entry.edited]
    },
    [viewImages]
  )

  const getActiveImageIndexForView = useCallback(
    (targetViewId: string) => {
      const sequence = getImageSequence(targetViewId)
      if (sequence.length === 0) return 0
      const fallbackIndex = sequence.length - 1
      const rawIndex = viewImageIndices[targetViewId]
      const clampedIndex =
        typeof rawIndex === "number"
          ? Math.min(Math.max(rawIndex, 0), fallbackIndex)
          : fallbackIndex
      return clampedIndex
    },
    [getImageSequence, viewImageIndices]
  )

  const getActiveImageUrlForView = useCallback(
    (targetViewId: string) => {
      const sequence = getImageSequence(targetViewId)
      if (sequence.length === 0) return null
      const index = getActiveImageIndexForView(targetViewId)
      return sequence[index] ?? null
    },
    [getImageSequence, getActiveImageIndexForView]
  )

  const shiftImageIndex = useCallback(
    (targetViewId: string, delta: number) => {
      setViewImageIndices((prev) => {
        const sequence = getImageSequence(targetViewId)
        if (sequence.length === 0) return prev
        const fallbackIndex = sequence.length - 1
        const currentIndex =
          typeof prev[targetViewId] === "number"
            ? Math.min(Math.max(prev[targetViewId], 0), fallbackIndex)
            : fallbackIndex
        const nextIndex = Math.min(
          Math.max(currentIndex + delta, 0),
          sequence.length - 1
        )
        if (nextIndex === currentIndex) return prev
        return { ...prev, [targetViewId]: nextIndex }
      })
    },
    [getImageSequence]
  )

  const applyEditedImage = useCallback(
    (viewId: string, nextUrl: string, fallbackOriginal?: string | null) => {
      let appendedIndex = 0
      setViewImages((prev) => {
        const current = prev[viewId] ?? {
          original: fallbackOriginal ?? null,
          edited: [],
        }
        const resolvedOriginal = current.original ?? fallbackOriginal ?? null
        const updatedEntry = {
          original: resolvedOriginal,
          edited: [...current.edited, nextUrl],
        }
        const sequenceLength =
          (resolvedOriginal ? 1 : 0) + updatedEntry.edited.length
        appendedIndex = Math.max(0, sequenceLength - 1)
        return {
          ...prev,
          [viewId]: updatedEntry,
        }
      })

      setViewImageIndices((prev) => ({
        ...prev,
        [viewId]: appendedIndex,
      }))

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

  const deleteLatestImage = useCallback(async () => {
    const viewId = resolveViewId()
    if (!viewId) return
    const entry = viewImages[viewId]
    if (!entry || entry.edited.length === 0) return

    setIsRevertingImage(true)
    try {
      const response = await revertViewImage(viewId)
      const updatedEdits = response.data?.edited_images ?? []
      const rawChatHistory = response.data?.chat_history
      const normalizedChatHistory = normalizeChatHistory(rawChatHistory)

      setViewImages((prev) => {
        const previous = prev[viewId]
        if (!previous) return prev
        return {
          ...prev,
          [viewId]: {
            original: previous.original,
            edited: [...updatedEdits],
          },
        }
      })

      const sequence: string[] = []
      if (entry.original) {
        sequence.push(entry.original)
      }
      sequence.push(...updatedEdits)

      const fallbackIndex = sequence.length > 0 ? sequence.length - 1 : 0
      const previousIndex = viewImageIndices[viewId] ?? fallbackIndex
      const nextIndex = sequence.length > 0 ? Math.min(previousIndex, sequence.length - 1) : 0

      setViewImageIndices((prev) => ({
        ...prev,
        [viewId]: nextIndex,
      }))

      if (rawChatHistory !== undefined) {
        setViewChats((prev) => ({
          ...prev,
          [viewId]: normalizedChatHistory,
        }))
      }

      const nextUrl = sequence[nextIndex] ?? null

      if (nextUrl) {
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
      }

      fetchSavedSessions()
    } catch (error) {
      console.error("Failed to delete latest image edit", error)
    } finally {
      setIsRevertingImage(false)
    }
  }, [
    resolveViewId,
    viewImages,
    viewImageIndices,
    setImages,
    setSelectedImage,
    viewLookup,
    fetchSavedSessions,
  ])

  const handleAssetDrop = useCallback(
    async (asset: AssetItem, instructions: string) => {
      const viewId = resolveViewId()
      if (!viewId || !instructions) return
      const trimmed = instructions.trim()
      if (!trimmed) return
      setIsChatSubmitting(true)

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
        const sourceImageUrl =
          getActiveImageUrlForView(viewId) ?? selectedImage?.imageUrl ?? null
        if (sourceImageUrl) {
          try {
            const generation = await addAssetToView(
              viewId,
              sourceImageUrl,
              asset.imageUrl,
              asset.name,
              trimmed
            )
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
        console.error("Failed to append asset placement", error)
      } finally {
        setIsChatSubmitting(false)
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

  const deleteAsset = useCallback(
    async (assetId: string) => {
      const viewId = resolveViewId()
      if (!viewId) return

      const targetAsset = viewAssets[viewId]?.find((asset) => asset.id === assetId)

      try {
        await deleteAssetRequest(viewId, assetId)
        setViewAssets((prev) => {
          const list = prev[viewId] ?? []
          const nextList = list.filter((asset) => asset.id !== assetId)
          return { ...prev, [viewId]: nextList }
        })

        if (targetAsset) {
          captureTimeline(`Asset removed · ${targetAsset.name}`)
        }
      } catch (error) {
        console.error("Failed to delete asset", error)
        throw error
      }
    },
    [captureTimeline, resolveViewId, viewAssets]
  )

  const deleteView = useCallback(
    async (viewId: string) => {
      if (!viewId) return

      try {
        await deleteViewRequest(viewId)

        setImages((prev) =>
          prev.filter((image) => {
            const imageViewId = image.viewId ?? viewLookup[image.id]
            return imageViewId !== viewId
          })
        )

        setViewLookup((prev) => {
          const next = { ...prev }
          Object.keys(next).forEach((key) => {
            if (next[key] === viewId) {
              delete next[key]
            }
          })
          return next
        })

        setViewImages((prev) => {
          if (!(viewId in prev)) return prev
          const next = { ...prev }
          delete next[viewId]
          return next
        })

        setViewChats((prev) => {
          if (!(viewId in prev)) return prev
          const next = { ...prev }
          delete next[viewId]
          return next
        })

        setViewAssets((prev) => {
          if (!(viewId in prev)) return prev
          const next = { ...prev }
          delete next[viewId]
          return next
        })

        setViewImageIndices((prev) => {
          if (!(viewId in prev)) return prev
          const next = { ...prev }
          delete next[viewId]
          return next
        })

        if (selectedImage) {
          const selectedViewId = selectedImage.viewId ?? viewLookup[selectedImage.id]
          if (selectedViewId === viewId) {
            setSelectedImage(null)
            setView("gallery")
          }
        }

        captureTimeline(`View deleted · ${viewId.slice(0, 6)}`)
        fetchSavedSessions()
      } catch (error) {
        console.error("Failed to delete view", error)
        throw error
      }
    },
    [
      viewLookup,
      selectedImage,
      captureTimeline,
      fetchSavedSessions,
    ]
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
          getActiveImageUrlForView(viewId) ?? selectedImage?.imageUrl ?? null
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
      getActiveImageUrlForView,
      selectedImage,
      applyEditedImage,
      fetchSavedSessions,
    ]
  )

  const activeViewId = resolveViewId()
  const activeImageUrl = activeViewId
    ? getActiveImageUrlForView(activeViewId) ?? selectedImage?.imageUrl ?? null
    : null

  const imageHistoryPosition = useMemo(() => {
    if (!activeViewId) {
      return { index: 0, count: 0 }
    }
    const sequence = getImageSequence(activeViewId)
    if (sequence.length === 0) {
      return { index: 0, count: 0 }
    }
    const index = getActiveImageIndexForView(activeViewId)
    return { index, count: sequence.length }
  }, [activeViewId, getActiveImageIndexForView, getImageSequence])

  const canDeleteLatestImage = useMemo(() => {
    if (!activeViewId) return false
    return (viewImages[activeViewId]?.edited.length ?? 0) > 0
  }, [activeViewId, viewImages])

  const goToPreviousImage = useCallback(() => {
    const viewId = resolveViewId()
    if (!viewId) return
    shiftImageIndex(viewId, -1)
  }, [resolveViewId, shiftImageIndex])

  const goToNextImage = useCallback(() => {
    const viewId = resolveViewId()
    if (!viewId) return
    shiftImageIndex(viewId, 1)
  }, [resolveViewId, shiftImageIndex])

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
    deleteAsset,
    chatHistory,
    sendChatMessage,
    isChatSubmitting,
    timeline,
    savedSessions,
    isSessionsLoading,
    resumeSession,
    deleteSession,
    activeImageUrl,
    imageHistoryPosition,
    goToPreviousImage,
    goToNextImage,
    canDeleteLatestImage,
    deleteLatestImage,
    isDeletingLatestImage: isRevertingImage,
    deleteView,
  }
}
