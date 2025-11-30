from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.flux_service import flux_service
from app.services.supabase_service import supabase_service
from app.services.scrape_service import scrape_service
from app.services.image_store import upload_remote_image
from pydantic import BaseModel
from typing import Optional
import uuid
import httpx

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str
    input_image: str
    input_image_2: Optional[str] = None
    view_id: str

class ListingUrl(BaseModel):
    url: str

@router.post("/generate")
async def update_image(request: GenerateRequest):
    """Updates an image via the Flux API and stores the result in Supabase."""
    try:
        initial_response = await flux_service.update_image(
            request.prompt,
            input_image=request.input_image,
            input_image_2=request.input_image_2,
        )
        polling_url = initial_response.get("polling_url")
        
        if not polling_url:
            raise HTTPException(status_code=500, detail="No polling URL received from Flux API")

        # 2. Poll for the result
        image_url = await flux_service.poll_result(polling_url)
        
        # 3. Download the image
        async with httpx.AsyncClient() as client:
            image_response = await client.get(image_url)
            image_response.raise_for_status()
            image_data = image_response.content
            
        # 4. Upload to Supabase
        content_type = image_response.headers.get("content-type", "image/jpeg")
        extension = "jpg" if "jpeg" in content_type else "png"
        file_name = f"{uuid.uuid4()}.{extension}"
        
        stored_path = supabase_service.upload_image(
            image_data, file_name, content_type=content_type, folder="generated"
        )
        public_url = supabase_service.get_public_url(stored_path)

        edited_images = supabase_service.append_edited_image(request.view_id, public_url)
        
        return {
            "status": "success",
            "data": {
                "url": public_url,
                "original_url": image_url,
                "view_id": request.view_id,
                "edited_images": edited_images,
            },
        }
    except Exception as e:
        import traceback
        print(f"Error during generation: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Uploads an image directly to Supabase.
    """
    try:
        contents = await file.read()
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "png"
        file_name = f"{uuid.uuid4()}.{file_extension}"
        
        stored_path = supabase_service.upload_image(
            contents,
            file_name,
            content_type=file.content_type or "image/png",
            folder="uploads",
        )
        public_url = supabase_service.get_public_url(stored_path)
        return {
            "status": "success",
            "file_path": stored_path,
            "public_url": public_url,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/images")
async def list_images():
    """
    List images from Supabase storage.
    """
    try:
        files = supabase_service.list_images()
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scrape")
async def scrape_listing(listing: ListingUrl):
    """
    Scrapes an image from a given listing URL and uploads it to Supabase.
    """

    try:
        scraped_items = await scrape_service.scrape_listing(listing.url)
        if not scraped_items:
            raise HTTPException(status_code=404, detail="No items scraped from the provided URL")

        image_urls = scrape_service.get_image_urls(scraped_items)
        if not image_urls:
            raise HTTPException(status_code=404, detail="No images returned from listing")

        stored_images = []
        for index, image_url in enumerate(image_urls):
            folder = f"scraped/{uuid.uuid4()}/{index}"
            public_url, storage_path = await upload_remote_image(image_url, folder=folder)
            stored_images.append(
                {
                    "source_url": image_url,
                    "public_url": public_url,
                    "storage_path": storage_path,
                }
            )

        return {"status": "success", "data": stored_images}


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AddAssetRequest(BaseModel):
    view_id: str
    view_url: str
    asset_url: str
    prompt: str

@router.post("/add-asset-to-view")
async def add_asset_to_view(request: AddAssetRequest):
    """
    Generates an image using Flux API and optionally uploads it to Supabase.
    """
    try:
        # 1. Call Flux API to start generation
        initial_response = await flux_service.add_asset_to_view(request.prompt, request.view_url, request.asset_url)
        polling_url = initial_response.get("polling_url")
        
        if not polling_url:
            raise HTTPException(status_code=500, detail="No polling URL received from Flux API")

        # 2. Poll for the result
        image_url = await flux_service.poll_result(polling_url)
        
        # 3. Download the image
        async with httpx.AsyncClient() as client:
            image_response = await client.get(image_url)
            image_response.raise_for_status()
            image_data = image_response.content
            
        # 4. Upload to Supabase
        content_type = image_response.headers.get("content-type", "image/jpeg")
        extension = "jpg" if "jpeg" in content_type else "png"
        file_name = f"{uuid.uuid4()}.{extension}"
        
        stored_path = supabase_service.upload_image(
            image_data, file_name, content_type=content_type, folder="generated"
        )
        public_url = supabase_service.get_public_url(stored_path)

        # 5. Append the edited image to the view
        edited_images = supabase_service.append_edited_image(request.view_id, public_url)

        return {
            "status": "success",
            "data": {
                "url": public_url,
                "original_url": image_url,
                "view_id": request.view_id,
                "edited_images": edited_images,
            },
        }
    
    except Exception as e:
        import traceback
        print(f"Error during generation: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))