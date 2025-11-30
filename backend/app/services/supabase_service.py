from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from supabase import Client, create_client

from app.core.config import settings

class SupabaseService:
    def __init__(self):
        self.url: str = settings.SUPABASE_URL
        self.key: str = settings.SUPABASE_KEY
        self.client: Client = create_client(self.url, self.key)
        self.bucket_name = "images"  # Replace with your actual bucket name

    def upload_image(
        self,
        file_content: bytes,
        file_name: str,
        content_type: str = "image/png",
        folder: Optional[str] = None,
    ) -> str:
        """
        Uploads a file to Supabase Storage.
        """
        try:
            storage_path = f"{folder.rstrip('/')}/{file_name}" if folder else file_name
            self.client.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": content_type},
            )
            return storage_path
        except Exception as e:
            print(f"Error uploading to Supabase: {str(e)}")
            raise e

    def get_public_url(self, file_name: str):
        """
        Gets the public URL for a file in Supabase Storage.
        """
        return self.client.storage.from_(self.bucket_name).get_public_url(file_name)

    def list_images(self):
        """
        List files in the bucket.
        """
        return self.client.storage.from_(self.bucket_name).list()

    # Database helpers -----------------------------------------------------

    def create_session(self) -> str:
        response = (
            self.client.table("sessions")
            .insert({"work_date": datetime.now(timezone.utc).isoformat()})
            .execute()
        )
        data = response.data
        if isinstance(data, list) and data:
            return data[0]["id"]
        if isinstance(data, dict) and "id" in data:
            return data["id"]
        raise RuntimeError("Failed to create session: missing id in Supabase response")

    def create_views(self, session_id: str, views: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        payload = []
        for view in views:
            payload.append(
                {
                    "session_id": session_id,
                    "original_image": view.get("original_image"),
                    "chat_history": view.get("chat_history", []),
                    "edited_images": view.get("edited_images", []),
                }
            )

        if not payload:
            return []

        response = (
            self.client.table("views")
            .insert(payload)
            .execute()
        )
        return response.data or []

    def _fetch_chat_history(self, view_id: str) -> List[Dict[str, Any]]:
        response = (
            self.client.table("views")
            .select("chat_history")
            .eq("id", view_id)
            .single()
            .execute()
        )
        return response.data.get("chat_history") or []

    def append_chat_entry(self, view_id: str, entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        history = self._fetch_chat_history(view_id)
        history.append(entry)
        (
            self.client.table("views")
            .update({"chat_history": history})
            .eq("id", view_id)
            .execute()
        )
        return history

    def remove_latest_chat_entry(self, view_id: str) -> List[Dict[str, Any]]:
        history = self._fetch_chat_history(view_id)
        if not history:
            return history

        history = history[:-1]
        (
            self.client.table("views")
            .update({"chat_history": history})
            .eq("id", view_id)
            .execute()
        )
        return history

    def _fetch_edited_images(self, view_id: str) -> List[str]:
        response = (
            self.client.table("views")
            .select("edited_images")
            .eq("id", view_id)
            .single()
            .execute()
        )
        data = response.data.get("edited_images") or []
        return data

    def append_edited_image(self, view_id: str, image_url: str) -> List[str]:
        images = self._fetch_edited_images(view_id)
        images.append(image_url)
        (
            self.client.table("views")
            .update({"edited_images": images})
            .eq("id", view_id)
            .execute()
        )
        return images

    def remove_latest_edited_image(self, view_id: str) -> List[str]:
        images = self._fetch_edited_images(view_id)
        if not images:
            return images

        images = images[:-1]
        (
            self.client.table("views")
            .update({"edited_images": images})
            .eq("id", view_id)
            .execute()
        )
        return images

    def insert_asset_record(self, view_id: str, name: str, url: str) -> Dict[str, Any]:
        response = (
            self.client.table("asset_library")
            .insert({"view_id": view_id, "name": name, "url": url})
            .execute()
        )
        data = response.data
        if isinstance(data, list) and data:
            return data[0]
        if isinstance(data, dict):
            return data
        raise RuntimeError("Failed to insert asset record")

    def get_asset_record(self, asset_id: str) -> Optional[Dict[str, Any]]:
        response = (
            self.client.table("asset_library")
            .select("id, view_id, name, url")
            .eq("id", asset_id)
            .single()
            .execute()
        )
        return response.data if response.data else None

    def update_asset_record(self, asset_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        if not updates:
            record = self.get_asset_record(asset_id)
            if not record:
                raise ValueError("Asset not found")
            return record

        (
            self.client.table("asset_library")
            .update(updates)
            .eq("id", asset_id)
            .execute()
        )

        record = self.get_asset_record(asset_id)
        if not record:
            raise ValueError("Asset not found")
        return record

    def delete_asset_record(self, asset_id: str) -> None:
        (
            self.client.table("asset_library")
            .delete()
            .eq("id", asset_id)
            .execute()
        )

    def delete_view(self, view_id: str) -> None:
        self.client.table("asset_library").delete().eq("view_id", view_id).execute()
        (
            self.client.table("views")
            .delete()
            .eq("id", view_id)
            .execute()
        )

    def delete_session(self, session_id: str) -> None:
        session_response = (
            self.client.table("sessions")
            .select("id")
            .eq("id", session_id)
            .execute()
        )
        session_records = session_response.data or []
        if not session_records:
            raise ValueError("Session not found")

        views_response = (
            self.client.table("views")
            .select("id")
            .eq("session_id", session_id)
            .execute()
        )
        view_ids = [item["id"] for item in (views_response.data or [])]

        if view_ids:
            (
                self.client.table("asset_library")
                .delete()
                .in_("view_id", view_ids)
                .execute()
            )
            (
                self.client.table("views")
                .delete()
                .in_("id", view_ids)
                .execute()
            )

        (
            self.client.table("sessions")
            .delete()
            .eq("id", session_id)
            .execute()
        )

    def list_sessions(self, limit: int = 10) -> List[Dict[str, Any]]:
        response = (
            self.client.table("sessions")
            .select(
                "id, work_date, views(id, original_image, edited_images, chat_history, asset_library(id, name, url))"
            )
            .order("work_date", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []

supabase_service = SupabaseService()
