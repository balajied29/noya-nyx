import Image from "next/image";
import CocktailHero from "./CocktailHero";
import { getMenu } from "@/content";

/** The hero: a labelled lineup of the signatures, each with its spec sheet. */
export default async function HeroSection() {
  const menu = await getMenu();
  const signatures = menu.find((c) => c.id === "signatures")?.items ?? [];

  return (
    <section className="hero hero--lineup" id="top">
      <div className="hero__media">
        <Image
          src="/images/bar-shelf.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={55}
        />
      </div>

      <div className="hero__head">
        <p className="eyebrow">Guwahati · Est. 2026</p>
        <h1 className="display display--l">
          Everything
          <span className="accent-italic">we pour.</span>
        </h1>
      </div>

      <CocktailHero drinks={signatures} />
    </section>
  );
}
