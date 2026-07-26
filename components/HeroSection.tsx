import CocktailHero from "./CocktailHero";
import { getMenu } from "@/content";

/** The list: a labelled lineup of the signatures, each with its spec sheet.
 *  Sits below the table hero now, as its own section. */
export default async function HeroSection() {
  const menu = await getMenu();
  const signatures = menu.find((c) => c.id === "signatures")?.items ?? [];

  return (
    <section className="hero hero--lineup" id="list">
      <div className="hero__head">
        <p className="eyebrow">The list</p>
        <h2 className="display display--l">
          Everything
          <span className="accent-italic">we pour.</span>
        </h2>
      </div>

      <CocktailHero drinks={signatures} />
    </section>
  );
}
