from supabase import create_client, Client
from app.core.config import settings
import os

class SupabaseService:
    def __init__(self):
        self.url: str = settings.SUPABASE_URL
        self.key: str = settings.SUPABASE_KEY
        self.client: Client = create_client(self.url, self.key)
        self.bucket_name = "images" # Replace with your actual bucket name

    def upload_image(self, file_content: bytes, file_name: str, content_type: str = "image/png"):
        """
        Uploads a file to Supabase Storage.
        """
        try:
            response = self.client.storage.from_(self.bucket_name).upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": content_type}
            )
            return response
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

supabase_service = SupabaseService()
