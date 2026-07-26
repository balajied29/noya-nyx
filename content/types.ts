/**
 * Shared content schema for the Hotel Palacio venues (Noya, Omara).
 *
 * These types are the contract between the sites and the future shared
 * dashboard. Components must only ever read content through the accessor
 * functions in `content/index.ts` — never import the raw data modules —
 * so the source can move from local files to the dashboard API without
 * touching a single component.
 */

/** Every venue the group operates. Content is namespaced by this. */
export type VenueId = "noya" | "omara";

/** Prices are whole rupees. Kept as a number so the dashboard can sort,
 *  filter and bulk-edit; formatting happens at render time. */
export type Price = number;

/** 0–5 on each axis, for the spec-sheet meters. */
export type TasteProfile = {
  sweet: number;
  sour: number;
  bitter: number;
  strength: number;
};

export type MenuItem = {
  id: string;
  name: string;
  /** Short flavour tags, e.g. "smoky / citrus / long". */
  tags?: string;
  /** Build with measures, for the spec sheet. */
  build?: { measure: string; what: string }[];
  glass?: string;
  garnish?: string;
  taste?: TasteProfile;
  /** Hero photograph for the featured view. */
  image?: string;
  /** Omit for market-price or unpriced items. */
  price?: Price;
  /** Rendered as a middot-separated list. */
  ingredients: string[];
  /** Hidden from the site when false — the dashboard's "86 it" toggle. */
  available?: boolean;
};

export type MenuCategory = {
  id: string;
  label: string;
  items: MenuItem[];
};

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  /** Free-form grouping used for the filter chips. */
  category: string;
  /** Lower sorts first; the dashboard reorders by rewriting this. */
  order: number;
};

export type EventItem = {
  id: string;
  title: string;
  blurb: string;
  /** ISO date. Undefined means an evergreen offering, not a dated event. */
  date?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type Venue = {
  id: VenueId;
  name: string;
  tagline: string;
  address: string[];
  phone: string;
  phoneHref: string;
  email?: string;
  hours: { label: string; value: string }[];
  instagram?: string;
  mapsQuery: string;
};

/** What a dashboard-backed source must implement. The local file source
 *  in `content/index.ts` satisfies this today. */
export type ContentSource = {
  getVenue(id: VenueId): Promise<Venue>;
  getMenu(id: VenueId): Promise<MenuCategory[]>;
  getGallery(id: VenueId): Promise<GalleryImage[]>;
  getEvents(id: VenueId): Promise<EventItem[]>;
};
