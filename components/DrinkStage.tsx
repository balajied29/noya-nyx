"use client";

import Image from "next/image";
import { useRef } from "react";
import HeroDrink from "./HeroDrink";

/**
 * The scroll stage.
 *
 * A tall section with a sticky viewport-height panel inside it. Sticky is used
 * rather than a pinned ScrollTrigger: no pin-spacer, no layout thrash on
 * resize, and far better behaviour on iOS, where pinning fights the address
 * bar. The section's height is what buys the scroll distance for the pours.
 */
export default function DrinkStage() {
  const stage = useRef<HTMLElement>(null);

  return (
    <section className="stage" ref={stage} id="build">
      <div className="stage__pin">
        <div className="hero hero--builder">
          <div className="hero__media">
            <Image
              src="/images/hero-pour.jpg"
              alt="A cocktail finished over smoke at the Noya bar"
              fill
              priority
              sizes="100vw"
              quality={60}
            />
          </div>

          <div className="hero__content">
            <p className="eyebrow">Guwahati · Est. 2026</p>
            <h1 className="hero__title display display--xl">
              Not every door is
              <span className="accent-italic">marked.</span>
            </h1>
          </div>

          <HeroDrink stageRef={stage} />
        </div>
      </div>
    </section>
  );
}
