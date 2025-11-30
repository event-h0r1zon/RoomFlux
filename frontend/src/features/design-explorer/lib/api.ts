import { MOCK_SCRAPED_IMAGES } from "../data/mock-data"
import type { ScrapedImage } from "./types"

const SIMULATED_DELAY = 700

const sleep = (duration = SIMULATED_DELAY) =>
  new Promise((resolve) => setTimeout(resolve, duration))

export async function scrapeImmoscout(url: string): Promise<ScrapedImage[]> {
  console.info("[scrapeImmoscout] Pretending to scrape:", url)
  await sleep()
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
