from __future__ import annotations

import base64
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field, HttpUrl

from app.services.image_store import upload_remote_image
from app.services.scrape_service import scrape_service
from app.services.supabase_service import supabase_service

router = APIRouter()


class ViewPayload(BaseModel):
  original_image: Optional[str] = None
  edited_images: List[str] = Field(default_factory=list)
  chat_history: List[Dict[str, Any]] = Field(default_factory=list)


class CreateSessionRequest(BaseModel):
  property_url: HttpUrl
  views: List[ViewPayload] = Field(default_factory=list)


class ChatEntryPayload(BaseModel):
  role: Literal["user", "asset"] = "user"
  message: str
  asset_name: Optional[str] = None
  asset_url: Optional[str] = None


async def _persist_image(raw_value: Optional[str], *, folder: str) -> Optional[str]:
  if not raw_value:
    return None

  if raw_value.startswith("data:"):
    try:
      header, encoded = raw_value.split(",", 1)
      content_type = header.split(";")[0].split(":")[1]
      extension = content_type.split("/")[-1]
      payload = base64.b64decode(encoded)
      file_name = f"{uuid4()}.{extension}"
      storage_path = supabase_service.upload_image(
        payload,
        file_name,
        content_type=content_type,
        folder=folder,
      )
      return supabase_service.get_public_url(storage_path)
    except Exception as exc:  # pragma: no cover - defensive
      raise HTTPException(status_code=400, detail=f"Invalid image payload: {exc}")

  if raw_value.startswith("http://") or raw_value.startswith("https://"):
    stored_url, _ = await upload_remote_image(raw_value, folder=folder)
    return stored_url

  return raw_value


@router.post("/sessions")
async def create_session(payload: CreateSessionRequest):
  """Create a new workspace session and seed it with initial views."""

  views_payload = payload.views
  if not views_payload:
    scraped_items = await scrape_service.scrape_listing(str(payload.property_url))
    image_urls = scrape_service.get_image_urls(scraped_items)
    if not image_urls:
      raise HTTPException(status_code=404, detail="No images found for the provided listing")
    views_payload = [
      ViewPayload(original_image=url, edited_images=[], chat_history=[])
      for url in image_urls
    ]

  session_id = supabase_service.create_session()

  prepared_views: List[Dict[str, Any]] = []
  for idx, view in enumerate(views_payload):
    folder_prefix = f"views/{session_id}/{idx}"
    original_image = await _persist_image(view.original_image, folder=folder_prefix)
    edited_images: List[str] = []
    for image in view.edited_images:
      stored = await _persist_image(image, folder=f"{folder_prefix}/edited")
      edited_images.append(stored or image)
    prepared_views.append(
      {
        "original_image": original_image,
        "edited_images": edited_images,
        "chat_history": view.chat_history,
      }
    )

  inserted_views = supabase_service.create_views(session_id, prepared_views)

  return {
    "session_id": session_id,
    "view_count": len(inserted_views),
    "views": inserted_views,
  }


@router.get("/sessions")
async def list_sessions(limit: int = 10):
  sessions = supabase_service.list_sessions(limit=limit)
  return {"sessions": sessions}


@router.post("/views/{view_id}/chat")
async def append_chat(view_id: str, payload: ChatEntryPayload):
  entry = {
    "id": str(uuid4()),
    "role": payload.role,
    "content": payload.message,
    "assetName": payload.asset_name,
    "assetUrl": payload.asset_url,
    "createdAt": datetime.now(timezone.utc).isoformat(),
  }

  history = supabase_service.append_chat_entry(view_id, entry)
  return {"view_id": view_id, "chat_history": history}


@router.post("/views/{view_id}/assets")
async def upload_asset(
  view_id: str,
  name: str = Form(...),
  instructions: Optional[str] = Form(None),
  file: UploadFile = File(...),
):
  contents = await file.read()
  extension = file.filename.split(".")[-1] if "." in file.filename else "png"
  safe_extension = extension.lower() or "png"
  file_name = f"{uuid4()}.{safe_extension}"
  storage_path = supabase_service.upload_image(
    contents,
    file_name,
    content_type=file.content_type or "image/png",
    folder=f"assets/{view_id}",
  )
  public_url = supabase_service.get_public_url(storage_path)

  asset_record = supabase_service.insert_asset_record(view_id, name, public_url)

  chat_entry = {
    "id": str(uuid4()),
    "role": "asset",
    "content": instructions or f"Uploaded {name}",
    "assetName": name,
    "assetUrl": public_url,
    "createdAt": datetime.now(timezone.utc).isoformat(),
  }
  supabase_service.append_chat_entry(view_id, chat_entry)

  return {
    "asset": asset_record,
    "public_url": public_url,
    "chat_entry": chat_entry,
  }


@router.delete("/views/{view_id}/assets/{asset_id}")
async def delete_asset(view_id: str, asset_id: str):
  asset = supabase_service.get_asset_record(asset_id)
  if not asset:
    raise HTTPException(status_code=404, detail="Asset not found")

  if asset.get("view_id") != view_id:
    raise HTTPException(status_code=400, detail="Asset does not belong to the specified view")

  supabase_service.delete_asset_record(asset_id)
  return {"status": "success", "asset_id": asset_id}
