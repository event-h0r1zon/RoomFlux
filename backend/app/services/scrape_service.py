from fastapi import HTTPException
from app.core.config import settings
from apify_client import ApifyClient

class ScrapeService:
    def init(self):
        self.api_key = settings.APIFY_CLIENT_TOKEN
        self.client = ApifyClient(self.api_key)
        self.actor_id = settings.APIFY_ACTOR_ID

    async def scrape_listing(self, url: str):
        """
        Scrapes the given listing URL using Apify Actor and returns the scraped data.
        """
        run_input = { "startUrls": [url] }

        # Run the Actor and wait for it to finish
        run = self.client.actor(self.actor_id).call(run_input=run_input)

        results = []
        # Fetch Actor results from the run's dataset (if there are any)
        for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
            results.append(item)

        return results

    def get_image_urls(self, scraped_items):
        """
        Extracts image URLs from the scraped items.
        """
        item = scraped_items[0]
        sections = item.get("sections", [])
        if not sections:
            raise HTTPException(status_code=404, detail="No sections found in the scraped item")
        media_section = [s for s in sections if s.get("type") == "MEDIA"]
        if not media_section:
            raise HTTPException(status_code=404, detail="No media section found in the scraped item")
        media_section = media_section[0]
        media = media_section.get("media", [])
        if not media:
            raise HTTPException(status_code=404, detail="No media found in the media section")
        pictures = [m for m in media if m.get("type") == "PICTURE"]

        data = [p["fullImageUrl"] for p in pictures if "fullImageUrl" in p]

        return data

scrape_service = ScrapeService()