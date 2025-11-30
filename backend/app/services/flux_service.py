import httpx
import asyncio
from app.core.config import settings

class FluxService:
    def __init__(self):
        self.api_key = settings.BFL_API_KEY
        self.base_url = settings.FLUX_API_URL
        self.headers = {
            "x-key": self.api_key,
            "Content-Type": "application/json",
            "accept": "application/json"
        }

    async def update_image(
        self,
        prompt: str,
        *,
        input_image: str,
        aspect_ratio: str = "1:1",
        **kwargs,
    ):
        """Call the Flux API to update an existing image using its URL."""

        async with httpx.AsyncClient() as client:
            payload = {
                "prompt": prompt,
                "input_image": input_image,
                "aspect_ratio": aspect_ratio,
                **kwargs,
            }
            try:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers=self.headers,
                    timeout=60.0,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Error calling Flux API: {e.response.text}")
                raise e
            except Exception as e:
                print(f"An error occurred: {str(e)}")
                raise e

    async def add_asset_to_view(self, prompt: str, view_url: str, asset_url: str, **kwargs):
        """
        Call the Flux API to start image generation.
        Returns the polling URL and request ID.
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "prompt": prompt,
                "input_image": view_url,
                "input_image2": asset_url,
                **kwargs
            }
            try:
                response = await client.post(self.base_url, json=payload, headers=self.headers, timeout=60.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Error calling Flux API: {e.response.text}")
                raise e
            except Exception as e:
                print(f"An error occurred: {str(e)}")
                raise e


    async def poll_result(self, polling_url: str, interval: float = 2.0, timeout: float = 60.0):
        """
        Polls the polling_url until the image is ready or timeout is reached.
        """
        async with httpx.AsyncClient() as client:
            start_time = asyncio.get_event_loop().time()
            while (asyncio.get_event_loop().time() - start_time) < timeout:
                try:
                    response = await client.get(polling_url, headers=self.headers, timeout=30.0)
                    response.raise_for_status()
                    data = response.json()
                    
                    # Check status based on BFL API response structure
                    # Usually it returns status: "Ready" or similar, and result with sample url
                    if data.get("status") == "Ready":
                        return data.get("result", {}).get("sample")
                    elif data.get("status") == "Failed":
                        raise Exception(f"Generation failed: {data}")
                    
                    # Wait before next poll
                    await asyncio.sleep(interval)
                except Exception as e:
                    print(f"Error polling Flux API: {str(e)}")
                    raise e
            
            raise TimeoutError("Image generation timed out")

flux_service = FluxService()
