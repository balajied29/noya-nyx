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
 * Content comes from the shared dashboard API when `CONTENT_API_URL` is set,
 * and from the local modules otherwise. Both paths satisfy the same
 * `ContentSource` contract, so no page or component knows which is in play —
 * which is what the async accessors were always for.
 *
 * The local files are kept deliberately as the fallback: if the API is
 * unreachable mid-deploy, the site renders yesterday's menu rather than an
 * empty page. A menu that is briefly stale is a far better failure than a
 * restaurant site with no menu on it.
 */

const API = process.env.CONTENT_API_URL;

/** Menus change a few times a day at most; a minute of staleness is fine. */
const REVALIDATE = 60;

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

async function fromApi<T>(path: string): Promise<T | null> {
  if (!API) return null;
  try {
    const res = await fetch(`${API}/api${path}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Network error, cold start, bad deploy — fall back rather than 500.
    return null;
  }
}

type ApiCategory = {
  id: string;
  label: string;
  items: {
    id: string;
    name: string;
    price: number | null;
    ingredients?: string[];
    tags?: string | null;
    glass?: string | null;
    garnish?: string | null;
    build?: { measure: string; what: string }[] | null;
    taste?: {
      sweet: number;
      sour: number;
      bitter: number;
      strength: number;
    } | null;
    image?: string | null;
  }[];
};

type ApiEvent = {
  id: string;
  title: string;
  blurb: string;
  startsOn: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

/**
 * Categories are addressed by slug, not by database id.
 *
 * Components look categories up by meaning — `menu.find(c => c.id ===
 * "signatures")` drives the homepage lineup. Mongo's ObjectIds are opaque and
 * change on every reseed, so passing them straight through blanked the hero
 * and broke the production build. Deriving the slug from the label keeps the
 * API and the local files addressable the same way.
 */
function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "category"
  );
}

/** Two categories named alike would collide; keep the ids unique for React keys. */
function uniqueSlugs(labels: string[]): string[] {
  const seen = new Map<string, number>();
  return labels.map((label) => {
    const base = slugify(label);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  });
}

export const source: ContentSource = {
  async getVenue(id: VenueId): Promise<Venue> {
    // Address, hours and phone are not dashboard-managed yet.
    return venueData(id).venue;
  },

  async getMenu(id: VenueId): Promise<MenuCategory[]> {
    const api = await fromApi<ApiCategory[]>(`/${id}/menu`);
    if (api?.length) {
      const slugs = uniqueSlugs(api.map((c) => c.label));
      return api
        .map((c, index) => ({
          id: slugs[index],
          label: c.label,
          items: c.items.map((i) => ({
            id: i.id,
            name: i.name,
            // The API sends null for market price; the site's shape omits it.
            ...(typeof i.price === "number" ? { price: i.price } : {}),
            ingredients: i.ingredients ?? [],
            tags: i.tags ?? undefined,
            glass: i.glass ?? undefined,
            garnish: i.garnish ?? undefined,
            build: i.build ?? undefined,
            taste: i.taste ?? undefined,
            image: i.image ?? undefined,
          })),
        }))
        .filter((c) => c.items.length > 0);
    }

    return venueData(id)
      .menu.map((category) => ({
        ...category,
        items: category.items.filter((item) => item.available !== false),
      }))
      .filter((category) => category.items.length > 0);
  },

  async getGallery(id: VenueId): Promise<GalleryImage[]> {
    // Gallery is still local: the images are in the repo, not Cloudinary.
    return [...venueData(id).gallery].sort((a, b) => a.order - b.order);
  },

  async getEvents(id: VenueId): Promise<EventItem[]> {
    const api = await fromApi<ApiEvent[]>(`/${id}/events`);
    if (api?.length) {
      return api.map((e) => ({
        id: e.id,
        title: e.title,
        blurb: e.blurb,
        date: e.startsOn ?? undefined,
        ctaLabel: e.ctaLabel ?? undefined,
        ctaHref: e.ctaHref ?? undefined,
      }));
    }
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

/** Posts a booking request to the dashboard. Returns false if it did not land. */
export async function submitReservation(input: {
  name: string;
  email?: string;
  phone?: string;
  partySize?: number;
  wantedFor?: string;
  occasion?: string;
  message?: string;
}): Promise<boolean> {
  if (!API) return false;
  try {
    const res = await fetch(`${API}/api/${VENUE_ID}/reservations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch {
    return false;
  }
}
