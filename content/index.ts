import * as noya from "./noya";
import type {
  ContentSource,
  EventItem,
  GalleryImage,
  MenuCategory,
  Venue,
  VenueId,
} from "./types";

export * from "./types";

/**
 * The single read path for all site content.
 *
 * Today this resolves from local modules. When the shared dashboard lands,
 * swap the body of `source` for a fetch against the dashboard API (with
 * `revalidate` or `revalidateTag` for ISR) — the accessors keep the same
 * async signature, so no page or component changes.
 *
 * Because every accessor is already async, components are written to await
 * their content. That is the whole point: it costs nothing now and avoids a
 * rewrite later.
 */

const VENUES = { noya } as const;

function venueData(id: VenueId) {
  const data = VENUES[id as keyof typeof VENUES];
  if (!data) {
    throw new Error(
      `No content registered for venue "${id}". Add content/${id}.ts and register it in content/index.ts.`
    );
  }
  return data;
}

export const source: ContentSource = {
  async getVenue(id: VenueId): Promise<Venue> {
    return venueData(id).venue;
  },

  async getMenu(id: VenueId): Promise<MenuCategory[]> {
    // Availability is filtered here so every consumer gets the same view.
    return venueData(id)
      .menu.map((category) => ({
        ...category,
        items: category.items.filter((item) => item.available !== false),
      }))
      .filter((category) => category.items.length > 0);
  },

  async getGallery(id: VenueId): Promise<GalleryImage[]> {
    return [...venueData(id).gallery].sort((a, b) => a.order - b.order);
  },

  async getEvents(id: VenueId): Promise<EventItem[]> {
    return venueData(id).events;
  },
};

/** This site is Noya; these are the convenience accessors pages use. */
export const VENUE_ID: VenueId = "noya";

export const getVenue = () => source.getVenue(VENUE_ID);
export const getMenu = () => source.getMenu(VENUE_ID);
export const getGallery = () => source.getGallery(VENUE_ID);
export const getEvents = () => source.getEvents(VENUE_ID);

/** Prices are stored as plain numbers; format only at the edge. */
export function formatPrice(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}
