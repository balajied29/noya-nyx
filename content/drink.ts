/**
 * The hero drink builder.
 *
 * Kept in `content/` alongside the menu so the shared dashboard can eventually
 * edit the signature serve — the pour colours, the order of layers and the CTA
 * are all data, not code.
 */

export type IngredientId =
  | "spirit"
  | "honey"
  | "citrus"
  | "bitters"
  | "ice"
  | "garnish";

export type Ingredient = {
  id: IngredientId;
  label: string;
  /** Shown under the label once poured. */
  note: string;
  /** Base colour of the pour. */
  color: string;
  /** Emissive lift so dark pours still read against a near-black page. */
  glow?: string;
  /** How much the glass fills, 0–1 of remaining headroom. */
  volume: number;
  /**
   * Denser pours sink and are drawn lower in the layer stack; lighter ones
   * float. This is what makes honey ribbon down through the drink.
   */
  density: number;
  /** Decorative only — never changes whether the recipe matches. */
  decorative?: boolean;
  /** Angle around the glass where the orb rests, in degrees. */
  angle: number;
};

export const INGREDIENTS: Ingredient[] = [
  {
    id: "spirit",
    label: "Bourbon",
    note: "The base",
    color: "#b4661f",
    glow: "#7a3c0d",
    volume: 0.34,
    density: 0.45,
    angle: 168,
  },
  {
    id: "honey",
    label: "Wildflower honey",
    note: "Ribbons down",
    color: "#e8a723",
    glow: "#c8811a",
    volume: 0.2,
    // Heaviest — sinks through everything, which is the whole point.
    density: 0.95,
    angle: 205,
  },
  {
    id: "citrus",
    label: "Tezpur lemon",
    note: "Lifts it",
    color: "#d8c53f",
    glow: "#9c8f1c",
    volume: 0.18,
    density: 0.3,
    angle: 242,
  },
  {
    id: "bitters",
    label: "Smoked til bitters",
    note: "A few dashes",
    color: "#6b2412",
    glow: "#40140a",
    volume: 0.06,
    density: 0.6,
    angle: 300,
  },
  {
    id: "ice",
    label: "Block ice",
    note: "Frosts the glass",
    color: "#cfe4ee",
    glow: "#8fb8cc",
    volume: 0.22,
    density: 0.05,
    angle: 338,
  },
  {
    id: "garnish",
    label: "Lime wheel",
    note: "The finish",
    color: "#93b53a",
    glow: "#5e7a1c",
    volume: 0,
    density: 0,
    decorative: true,
    angle: 22,
  },
];

/** The core pours that make the signature serve. Garnish is decorative. */
export const SIGNATURE_RECIPE: IngredientId[] = [
  "spirit",
  "honey",
  "citrus",
  "ice",
];

export const SIGNATURE = {
  name: "Muga",
  tagline: "Bourbon · Smoked til · Wildflower honey",
  blurb:
    "You built the house serve. Named for the golden silk spun only in Assam — and about the same colour.",
  primaryCta: { label: "Order it", href: "#private" },
  secondaryCta: { label: "Find it near you", href: "#private" },
};

/**
 * Anything that is not the signature still gets a name. There is no failure
 * state — an unexpected pour is a discovery, so it is named and kept.
 */
const IMPROVISED_NAMES: Record<string, string> = {
  "bitters,honey,spirit": "Low Winter Sun",
  "citrus,honey,spirit": "Bee Line",
  "honey,ice,spirit": "Slow Gold",
  "citrus,ice,spirit": "Paltan Cooler",
  "bitters,citrus,honey,ice,spirit": "The Long Way Round",
  "citrus,honey,ice": "Monsoon Cordial",
  "honey,spirit": "Two Ingredients, No Regrets",
};

export function nameFor(core: IngredientId[]): string {
  if (core.length === 0) return "An empty glass";
  const key = [...core].sort().join(",");
  if (IMPROVISED_NAMES[key]) return IMPROVISED_NAMES[key];
  if (core.length === 1) {
    const ing = INGREDIENTS.find((i) => i.id === core[0]);
    return `Neat ${ing?.label.split(" ").pop()?.toLowerCase() ?? "pour"}`;
  }
  return "Off-menu";
}

export function isSignature(core: IngredientId[]): boolean {
  if (core.length !== SIGNATURE_RECIPE.length) return false;
  const set = new Set(core);
  return SIGNATURE_RECIPE.every((id) => set.has(id));
}
