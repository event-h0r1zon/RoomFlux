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
                    timeout=180.0,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Error calling Flux API: {e.response.text}")
                raise e
            except Exception as e:
                print(f"An error occurred: {str(e)}")
                raise e

    async def add_asset_to_view(self, prompt: str, view_url: str, asset_url: str, asset_name: str, **kwargs):
        """
        Call the Flux API to start image generation.
        Returns the polling URL and request ID.
        """

        final_prompt = (
            """
### ROLE DEFINITION
You are an expert Virtual Stager and Interior Renovation AI. Your primary function is to modify interior spaces based on an input image while maintaining strict adherence to the original architectural structure, perspective, and lighting conditions. You are adding, removing, or rearranging elements *within* an existing reality, not creating a new one.

1.  **Structural Integrity (Immutable Geometry):**
    * **DO NOT** alter the room's physical shell unless explicitly instructed. Walls, windows, ceilings, door frames, and flooring types must remain consistent with the input image.
    * Preserve the original camera angle, focal length, and perspective. The "container" of the room must match the source exactly.
2.  **Lighting & Atmospheric Continuity:**
    * Analyze the light sources in the input image (direction, intensity, color temperature).
    * Any new furniture or appliances added must cast shadows consistent with existing light sources.
    * Reflections on new surfaces (e.g., a new glossy fridge) must reflect the existing environment.
3.  **Seamless Integration (The "Inpainting" Logic):**
    * New objects must blend seamlessly with the environment. Ensure correct occlusion. Scale new items relative to existing "anchor objects".
4.  **Stylistic Cohesion:**
    * Unless the user asks for a style overhaul, match the texture fidelity and color grading of the new items to the original image's quality (e.g., if the photo is grainy, the new item should have slight grain).
5.  **Do not** change the time of day or window views, move structural pillars, fireplaces, or built-in architectural features or change the aspect ratio or crop the image composition unless asked.
            """.strip() +f"\n\n### TASK\nExtract the asset named '{asset_name}' from the second image and integrate it into the first image realistically according to the prompt: {prompt}"
        )

        async with httpx.AsyncClient() as client:
            payload = {
                "prompt": final_prompt,
                "input_image": view_url,
                "input_image_2": asset_url,
                **kwargs
            }
            try:
                response = await client.post(self.base_url, json=payload, headers=self.headers, timeout=180.0)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Error calling Flux API: {e.response.text}")
                raise e
            except Exception as e:
                print(f"An error occurred: {str(e)}")
                raise e


    async def poll_result(self, polling_url: str, interval: float = 2.0, timeout: float = 180.0):
        """
        Polls the polling_url until the image is ready or timeout is reached.
        """
        async with httpx.AsyncClient() as client:
            start_time = asyncio.get_event_loop().time()
            while (asyncio.get_event_loop().time() - start_time) < timeout:
                try:
                    response = await client.get(polling_url, headers=self.headers, timeout=180.0)
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
