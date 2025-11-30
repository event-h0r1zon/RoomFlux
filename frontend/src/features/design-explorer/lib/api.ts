import { MOCK_SCRAPED_IMAGES } from "../data/mock-data"
import type { ScrapedImage } from "./types"

const SIMULATED_DELAY = 700

const sleep = (duration = SIMULATED_DELAY) =>
  new Promise((resolve) => setTimeout(resolve, duration))

export async function scrapeImmoscout(url: string): Promise<ScrapedImage[]> {
  console.info("[scrapeImmoscout] Scraping:", url)


  // STEP 1: SCRAPE FOR IMAGE URLS

  const image_urls = await fetch("http://localhost:8000/api/v1/images/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  console.log("Received response from /api/v1/images/scrape");

  if (!image_urls.ok) {
    throw new Error("Failed to scrape images from Immoscout");
  }

  const data = await image_urls.json();
  console.log("Scraped image URLs:", data);


  // STEP 2: UPLOAD SCRAPED IMAGES TO BACKEND

  for (const imageUrl of data.image_urls) {

    const imageFile = await fetch(imageUrl).then(res => res.blob());

    // DENIS DO SOMETHING HERE !!!
  }



  return MOCK_SCRAPED_IMAGES
}

export async function generateWithAsset(
  image: ScrapedImage,
  assetId: string,
  instructions: string
): Promise<void> {
  console.info(
    "[generateWithAsset] Mock request",
    image.id,
    assetId,
    instructions
  )

  await sleep(500)
}

export async function generateWithPrompt(
  image: ScrapedImage,
  text: string
): Promise<string> {
  console.info("[generateWithPrompt] Mock request", image.id, text)
  await sleep(600)
  return `Noted: ${text}`
}
