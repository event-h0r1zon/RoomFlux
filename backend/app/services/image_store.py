from __future__ import annotations

from typing import Optional, Tuple
from uuid import uuid4

import httpx
from fastapi import HTTPException

from app.services.supabase_service import supabase_service

DEFAULT_TIMEOUT = 30


def _derive_extension(content_type: Optional[str]) -> str:
  if not content_type:
    return "jpg"
  media_type = content_type.split(";")[0].strip().lower()
  if "/" in media_type:
    ext = media_type.split("/")[-1]
    if ext:
      return ext
  return "jpg"


async def upload_remote_image(
  url: str,
  *,
  folder: Optional[str] = None,
  timeout: int = DEFAULT_TIMEOUT,
) -> Tuple[str, str]:
  """Download a remote image and store it in Supabase."""

  try:
    async with httpx.AsyncClient(timeout=timeout) as client:
      response = await client.get(url)
      response.raise_for_status()
  except Exception as exc:  # pragma: no cover - network defensive
    raise HTTPException(status_code=502, detail=f"Failed to fetch image: {exc}")

  content_type = response.headers.get("content-type", "image/jpeg")
  extension = _derive_extension(content_type)
  file_name = f"{uuid4()}.{extension}"

  storage_path = supabase_service.upload_image(
    response.content,
    file_name,
    content_type=content_type,
    folder=folder,
  )
  public_url = supabase_service.get_public_url(storage_path)
  return public_url, storage_path
