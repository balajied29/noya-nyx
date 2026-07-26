# Noya by NYX

Cocktail room at Hotel Palacio, Guwahati. Sister venue to Omara.

Design direction: **1a — The Cellar** (hidden, brass, candlelit) from the
supplied concept file.

## Stack

Matches Omara exactly, so the two can merge into one monorepo later:

- Next.js 16 (App Router) + React 19 + TypeScript
- GSAP (ScrollTrigger, SplitText) — scroll-driven reveals and parallax
- Framer Motion — component transitions, menu tabs, the quiz
- Lenis — smooth wheel scrolling (disabled on touch, where native is better)

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Content layer — built for the shared dashboard

Both venues are owned by Hotel Palacio and will eventually be managed from a
single dashboard. Nothing about that dashboard exists yet, but the site is
already shaped to receive it.

**The rule: components never import content directly.** Everything flows
through the accessors in `content/index.ts`:

```
content/
  types.ts    Shared schema — the contract with the future dashboard
  noya.ts     This venue's data (menu, gallery, events, venue details)
  index.ts    The single read path: getVenue/getMenu/getGallery/getEvents
```

Every accessor is **already async**, even though it currently resolves from a
local file. That is deliberate — when the dashboard lands, only the body of
`source` in `content/index.ts` changes to a fetch. No page or component is
touched.

```ts
// today
async getMenu(id) { return venueData(id).menu }

// with the dashboard, same signature
async getMenu(id) {
  const res = await fetch(`${API}/venues/${id}/menu`, {
    next: { tags: [`menu:${id}`] },   // revalidateTag on save
  })
  return res.json()
}
```

`types.ts` is the piece to share first — copy it into Omara (or lift both into
a `packages/content` workspace) so the dashboard writes one schema for both
venues. `VenueId` is already `"noya" | "omara"`.

### What the dashboard will control

Per the brief: **menus & prices**, **gallery images**, **events &
announcements**. The schema covers all three:

- `MenuItem.available` — an "86 it" toggle; filtered out in `getMenu`
- `GalleryImage.order` — drag-to-reorder writes this field
- `MenuItem.price` — plain numbers, so the dashboard can sort and bulk-edit;
  formatted only at render via `formatPrice`

Hours and contact were **not** in scope, so `Venue` holds them as static data.
Moving them later is additive — no restructuring needed.

## Before launch

- **The drinks list is placeholder.** Cocktail names, ingredients and prices
  come from the design mock-up, not the bar. A visible notice on the page says
  so — remove it when the real list goes in.
- **Phone number is a placeholder.** It drives both the tap-to-call link and
  the WhatsApp CTA.
- **The floor is unconfirmed.** The address uses the Hotel Palacio building
  (Omara is on the 4th). The concept file said "6th floor, G.S. Road,
  Christian Basti" — a different building — which contradicts the two venues
  sharing a property, so that was not used.
- No logo file was supplied; the wordmark is set in Cormorant Garamond.
