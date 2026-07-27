import type { EventItem, GalleryImage, MenuCategory, Venue } from "./types";

/**
 * Noya content.
 *
 * PLACEHOLDER NOTICE — the cocktail names, ingredients and prices below come
 * from the design mock-up, not from the bar. They exist so the layout can be
 * built and reviewed. Replace wholesale before launch.
 */

export const venue: Venue = {
  id: "noya",
  name: "Noya",
  tagline: "A cocktail room above the city",
  // Same property as Omara — Hotel Palacio. Floor to be confirmed.
  address: [
    "Noya, Hotel Palacio",
    "Paltan Bazaar, HP Brahmachari Road",
    "Guwahati 781008, Assam",
  ],
  phone: "[+91 00000 00000]",
  phoneHref: "tel:+910000000000",
  hours: [
    { label: "Tuesday — Sunday", value: "6pm until late" },
    { label: "Kitchen closes", value: "11:30pm" },
    { label: "Monday", value: "Closed" },
  ],
  mapsQuery:
    "Hotel Palacio, Paltan Bazaar, HP Brahmachari Road, Guwahati 781008",
};

export const menu: MenuCategory[] = [
  {
    id: "signatures",
    label: "Signatures",
    items: [
      {
        id: "brahmaputra-fog",
        name: "Brahmaputra Fog",
        price: 780,
        ingredients: ["Gin", "Bhut jolokia tincture", "Tonka smoke"],
        tags: "smoky / long / bracing",
        glass: "Highball",
        garnish: "Tonka smoke, lemon coin",
        image: "/images/smoke-glass.jpg",
        taste: { sweet: 1, sour: 2, bitter: 3, strength: 4 },
        build: [
          { measure: "45 ml", what: "Gin" },
          { measure: "15 ml", what: "Bhut jolokia tincture" },
          { measure: "20 ml", what: "Lemon" },
          { measure: "Top", what: "Soda" },
        ],
      },
      {
        id: "silk-route",
        name: "Silk Route",
        price: 820,
        ingredients: ["Aged rum", "Black rice", "Jaggery", "Coconut"],
        tags: "rich / sweet / round",
        glass: "Coupe",
        garnish: "Toasted coconut",
        image: "/images/drink-coupe.jpg",
        taste: { sweet: 4, sour: 1, bitter: 1, strength: 3 },
        build: [
          { measure: "50 ml", what: "Aged rum" },
          { measure: "20 ml", what: "Black rice cordial" },
          { measure: "10 ml", what: "Jaggery" },
          { measure: "15 ml", what: "Coconut" },
        ],
      },
      {
        id: "kaziranga-dusk",
        name: "Kaziranga Dusk",
        price: 850,
        ingredients: ["Mezcal", "Tomato leaf", "Kaffir", "Saline"],
        tags: "savoury / smoky / dry",
        glass: "Rocks",
        garnish: "Kaffir leaf",
        image: "/images/drink-mist.jpg",
        taste: { sweet: 1, sour: 2, bitter: 4, strength: 4 },
        build: [
          { measure: "45 ml", what: "Mezcal" },
          { measure: "15 ml", what: "Tomato leaf" },
          { measure: "10 ml", what: "Kaffir" },
          { measure: "2 dash", what: "Saline" },
        ],
      },
      {
        id: "tezpur-sour",
        name: "Tezpur Sour",
        price: 740,
        ingredients: ["Vodka", "Tezpur lemon", "Egg white", "Pepper"],
        tags: "sharp / silky / citrus",
        glass: "Coupe",
        garnish: "Cracked pepper",
        image: "/images/drink-citrus.jpg",
        taste: { sweet: 2, sour: 5, bitter: 1, strength: 3 },
        build: [
          { measure: "45 ml", what: "Vodka" },
          { measure: "25 ml", what: "Tezpur lemon" },
          { measure: "15 ml", what: "Sugar" },
          { measure: "1", what: "Egg white" },
        ],
      },
      {
        id: "muga",
        name: "Muga",
        price: 890,
        ingredients: ["Bourbon", "Smoked til", "Wildflower honey"],
        tags: "golden / warm / honeyed",
        glass: "Rocks",
        garnish: "Smoked til",
        image: "/images/cocktail-velvet.jpg",
        taste: { sweet: 3, sour: 2, bitter: 2, strength: 5 },
        build: [
          { measure: "50 ml", what: "Bourbon" },
          { measure: "15 ml", what: "Wildflower honey" },
          { measure: "20 ml", what: "Lemon" },
          { measure: "2 dash", what: "Smoked til bitters" },
        ],
      },
      {
        id: "bihu-bonfire",
        name: "Bihu Bonfire",
        price: 900,
        ingredients: ["Peated whisky", "Pitha syrup", "Clarified milk"],
        tags: "smoky / creamy / deep",
        glass: "Rocks",
        garnish: "Clarified milk foam",
        image: "/images/glass-texture.jpg",
        taste: { sweet: 3, sour: 1, bitter: 3, strength: 5 },
        build: [
          { measure: "45 ml", what: "Peated whisky" },
          { measure: "20 ml", what: "Pitha syrup" },
          { measure: "30 ml", what: "Clarified milk" },
        ],
      },
    ],
  },
  {
    id: "classics",
    label: "Classics",
    items: [
      {
        id: "negroni",
        name: "Negroni",
        price: 700,
        ingredients: ["Gin", "Bitter", "Sweet vermouth"],
      },
      {
        id: "old-fashioned",
        name: "Old Fashioned",
        price: 780,
        ingredients: ["Bourbon", "Demerara", "Angostura"],
      },
      {
        id: "martini",
        name: "Martini",
        price: 760,
        ingredients: ["Gin or vodka", "Dry vermouth", "Olive or twist"],
      },
      {
        id: "daiquiri",
        name: "Daiquiri",
        price: 720,
        ingredients: ["White rum", "Lime", "Sugar"],
      },
    ],
  },
  {
    id: "zero-proof",
    label: "Zero proof",
    items: [
      {
        id: "garden-tonic",
        name: "Garden Tonic",
        price: 450,
        ingredients: ["Cucumber", "Coriander", "Tonic"],
      },
      {
        id: "smoked-tea",
        name: "Smoked Tea Highball",
        price: 480,
        ingredients: ["Assam second flush", "Citrus", "Soda"],
      },
      {
        id: "kokum-cooler",
        name: "Kokum Cooler",
        price: 460,
        ingredients: ["Kokum", "Black salt", "Lime"],
      },
    ],
  },
  {
    id: "plates",
    label: "Plates",
    items: [
      {
        id: "smoked-paneer",
        name: "Smoked paneer skewers",
        price: 520,
        ingredients: ["Charred pepper", "Sesame", "Mint"],
      },
      {
        id: "pork-ribs",
        name: "Sticky pork ribs",
        price: 680,
        ingredients: ["Jaggery glaze", "Bhut jolokia", "Lime"],
      },
      {
        id: "khar-croquettes",
        name: "Khar croquettes",
        price: 460,
        ingredients: ["Local greens", "Rice crumb", "Tamarind"],
      },
      {
        id: "fish-tikka",
        name: "River fish tikka",
        price: 620,
        ingredients: ["Mustard", "Coriander stem", "Charcoal"],
      },
    ],
  },
];

export const gallery: GalleryImage[] = [
  { id: "g1", src: "/images/bar-shelf.jpg", alt: "The back bar in low light", category: "The room", order: 1 },
  { id: "g2", src: "/images/smoke-glass.jpg", alt: "Aromatic mist over a glass cloche", category: "The bar", order: 2 },
  { id: "g3", src: "/images/room-interior.jpg", alt: "Velvet chairs and low tables", category: "The room", order: 3 },
  { id: "g4", src: "/images/hero-pour.jpg", alt: "A cocktail finished over smoke", category: "The bar", order: 4 },
  { id: "g5", src: "/images/plate-skewers.jpg", alt: "Skewers and pickles, plated", category: "Plates", order: 5 },
  { id: "g6", src: "/images/shaker-pour.jpg", alt: "Pouring into the shaker", category: "The bar", order: 6 },
  { id: "g7", src: "/images/cocktail-velvet.jpg", alt: "A coupe resting on velvet", category: "The bar", order: 7 },
  { id: "g8", src: "/images/bartender-late.jpg", alt: "A drink built at the bar, late", category: "Late", order: 8 },
  { id: "g9", src: "/images/plate-bowl.jpg", alt: "A shared bowl", category: "Plates", order: 9 },
  { id: "g10", src: "/images/chairs-dark.jpg", alt: "A corner table", category: "The room", order: 10 },
  { id: "g11", src: "/images/jigger.jpg", alt: "Measuring a pour", category: "The bar", order: 11 },
  { id: "g12", src: "/images/ceiling-brass.jpg", alt: "Brass detail overhead", category: "The room", order: 12 },
];

export const events: EventItem[] = [
  {
    id: "buyouts",
    title: "Take the room for the night",
    blurb:
      "Buy-outs, tasting menus and bar takeovers for 20–60 guests. Tell us the date and we will tell you what we can build.",
    ctaLabel: "WhatsApp the bar",
  },
  // Dated nights are placeholders like the menu above — replace before launch.
  {
    id: "monsoon-flights",
    title: "Monsoon flights",
    blurb:
      "Five pours built around what the rain brings up — wet earth, green mango, smoked salt. One seating, twelve stools.",
    date: "2026-08-14",
    ctaLabel: "Hold a stool",
  },
  {
    id: "guest-shift-aug",
    title: "Guest shift — the rail goes to Bombay",
    blurb:
      "A visiting bartender takes the rail for one night only. Their list, our shelf, no substitutions.",
    date: "2026-08-29",
    ctaLabel: "Hold a stool",
  },
  {
    id: "residency",
    title: "Guest shifts",
    blurb:
      "Visiting bartenders take the rail for one night only. Announced first on Instagram.",
  },
  {
    id: "tastings",
    title: "Tasting flights",
    blurb:
      "Five pours, one thread — a walk through the shelf of local tinctures, led by whoever built them.",
  },
];
