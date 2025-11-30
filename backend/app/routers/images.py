from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.flux_service import flux_service
from app.services.supabase_service import supabase_service
from pydantic import BaseModel
import uuid
import httpx

router = APIRouter()

class GenerateRequest(BaseModel):
    prompt: str

@router.post("/generate")
async def generate_image(request: GenerateRequest):
    """
    Generates an image using Flux API and optionally uploads it to Supabase.
    """
    try:
        # 1. Call Flux API to start generation
        initial_response = await flux_service.generate_image(request.prompt)
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
        
        supabase_service.upload_image(image_data, file_name, content_type=content_type)
        public_url = supabase_service.get_public_url(file_name)
        
        return {"status": "success", "data": {"url": public_url, "original_url": image_url}}
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
        
        response = supabase_service.upload_image(contents, file_name, content_type=file.content_type)
        public_url = supabase_service.get_public_url(file_name)
        
        return {"status": "success", "file_path": file_name, "public_url": public_url}
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
