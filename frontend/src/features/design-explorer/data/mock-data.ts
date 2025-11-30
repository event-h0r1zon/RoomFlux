import type { ScrapedImage } from "../lib/types"

export const MOCK_SCRAPED_IMAGES: ScrapedImage[] = [
  {
    id: "living-room-01",
    title: "Luminous Living",
    roomType: "Living Room",
    description:
      "South-facing living room with herringbone oak floors and floor-to-ceiling glazing.",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
    tags: ["Living", "Scandinavian", "Neutral"],
  },
  {
    id: "kitchen-01",
    title: "Marble Lineage",
    roomType: "Kitchen",
    description:
      "Open kitchen anchored by a sculpted marble island and smoked walnut cabinetry.",
    imageUrl:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80",
    tags: ["Kitchen", "Modern", "Natural Light"],
  },
  {
    id: "bedroom-01",
    title: "Soft Shelter",
    roomType: "Bedroom",
    description:
      "Primary suite concept with layered textiles, cove lighting, and integrated storage wall.",
    imageUrl:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    tags: ["Bedroom", "Warm", "Calming"],
  },
]
