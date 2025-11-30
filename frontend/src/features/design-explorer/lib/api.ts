import { MOCK_SCRAPED_IMAGES } from "../data/mock-data"
import type { ScrapedImage } from "./types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"

const withJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Request failed")
  }
  return response.json() as Promise<T>
}

export async function scrapeImmoscout(url: string): Promise<ScrapedImage[]> {
  console.info("[scrapeImmoscout] Scraping:", url)

  try {
    const response = await fetch(`${API_BASE_URL}/images/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })

    const payload = await withJson<{ status: string; data: Array<{ source_url: string; public_url: string; storage_path: string }> }>(response)

    if (!payload.data || payload.data.length === 0) {
      throw new Error("No images returned from scrape endpoint")
    }

    return payload.data.map((entry, index) => ({
      id: entry.storage_path ?? `${entry.public_url}-${index}`,
      title: `Listing view ${index + 1}`,
      roomType: "Unknown",
      description: entry.source_url,
      imageUrl: entry.public_url,
      tags: ["scraped"],
    }))
  } catch (error) {
    console.error("Failed to scrape via API, falling back to mock data", error)
    return MOCK_SCRAPED_IMAGES
  }
}

type ViewSeedPayload = {
  original_image?: string | null
  edited_images?: string[]
  chat_history?: unknown[]
}

type CreateSessionResponse = {
  session_id: string
  view_count: number
  views: { id: string; original_image?: string | null }[]
}

export async function createSession(request: {
  propertyUrl: string
  views: ViewSeedPayload[]
}): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      property_url: request.propertyUrl,
      views: request.views,
    }),
  })

  return withJson<CreateSessionResponse>(response)
}

type AppendChatResponse = {
  view_id: string
  chat_history: Array<Record<string, unknown>>
}

export async function appendChat(
  viewId: string,
  payload: {
    role: "user" | "asset"
    message: string
    assetName?: string
    assetUrl?: string
  }
): Promise<AppendChatResponse> {
  const response = await fetch(`${API_BASE_URL}/views/${viewId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: payload.role,
      message: payload.message,
      asset_name: payload.assetName,
      asset_url: payload.assetUrl,
    }),
  })

  return withJson<AppendChatResponse>(response)
}

type UploadAssetResponse = {
  asset: { id: string; name: string; url: string; view_id: string }
  public_url: string
  chat_entry?: Record<string, unknown>
}

export async function uploadAsset(
  viewId: string,
  payload: { name: string; file: File; instructions?: string }
): Promise<UploadAssetResponse> {
  const formData = new FormData()
  formData.append("name", payload.name)
  if (payload.instructions) {
    formData.append("instructions", payload.instructions)
  }
  formData.append("file", payload.file)

  const response = await fetch(`${API_BASE_URL}/views/${viewId}/assets`, {
    method: "POST",
    body: formData,
  })

  return withJson<UploadAssetResponse>(response)
}

type UpdateImageResponse = {
  status: string
  data: {
    url: string
    original_url: string
    view_id: string
    edited_images?: string[]
  }
}

export async function updateViewImage(
  viewId: string,
  payload: { prompt: string; inputImage: string; referenceImage?: string }
): Promise<UpdateImageResponse> {
  const response = await fetch(`${API_BASE_URL}/images/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: payload.prompt,
      input_image: payload.inputImage,
      input_image_2: payload.referenceImage,
      view_id: viewId,
    }),
  })

  return withJson<UpdateImageResponse>(response)
}

type SessionViewRecord = {
  id: string
  original_image?: string | null
  edited_images?: string[]
  chat_history?: Array<Record<string, unknown>>
  asset_library?: Array<{ id: string; name: string; url: string }>
}

type SessionRecord = {
  id: string
  work_date?: string
  views?: SessionViewRecord[]
}

export async function fetchSessions(limit = 5): Promise<{ sessions: SessionRecord[] }> {
  const response = await fetch(`${API_BASE_URL}/sessions?limit=${limit}`)
  return withJson<{ sessions: SessionRecord[] }>(response)
}
