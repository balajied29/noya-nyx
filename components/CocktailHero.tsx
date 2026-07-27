"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { MenuItem } from "@/content";
import { formatPrice } from "@/content";

/**
 * The lineup.
 *
 * Six drinks sit in a row. Picking one promotes it: the photograph morphs from
 * its slot into the plate on the right (a shared layout animation, so it is
 * one element moving rather than a crossfade between two), and the spec sheet
 * assembles line by line beside it.
 *
 * Everything here is DOM and compositor-friendly transforms — no canvas — so
 * it costs a fraction of the 3D hero it replaces and behaves on a phone.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const AXES = [
  { key: "sweet", label: "Sweet" },
  { key: "sour", label: "Sour" },
  { key: "bitter", label: "Bitter" },
  { key: "strength", label: "Strength" },
] as const;

export default function CocktailHero({ drinks }: { drinks: MenuItem[] }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  // Selecting used to re-centre the rail, which slid a different thumbnail
  // under the pointer and re-fired hover-select. Only re-centre when the
  // change came from somewhere other than the rail itself.
  const fromRail = useRef(false);
  const [fine, setFine] = useState(false);
  const active = drinks[index];

  useEffect(() => {
    const q = window.matchMedia("(hover: hover) and (pointer: fine)");
    setFine(q.matches);
    const on = () => setFine(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  // Idles through the list until the visitor takes over.
  useEffect(() => {
    // `% 0` is NaN, which would park the index off the list forever.
    if (!auto || reduce || drinks.length === 0) return;
    const t = window.setInterval(
      () => setIndex((i) => (i + 1) % drinks.length),
      4200
    );
    return () => window.clearInterval(t);
  }, [auto, reduce, drinks.length]);

  const pick = useCallback((i: number, viaRail = false) => {
    fromRail.current = viaRail;
    setAuto(false);
    setIndex(i);
  }, []);

  // Arrow keys walk the lineup.
  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        pick((index + 1) % drinks.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        pick((index - 1 + drinks.length) % drinks.length);
      }
    },
    [index, drinks.length, pick]
  );

  // Keep the chosen slot in view on narrow screens.
  useEffect(() => {
    if (fromRail.current) {
      fromRail.current = false;
      return;
    }
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>(`[data-slot="${index}"]`);
    if (!rail || !el) return;
    const target = el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2;
    rail.scrollTo({ left: target, behavior: reduce ? "auto" : "smooth" });
  }, [index, reduce]);

  // An empty list is a real state now that the menu comes from the dashboard:
  // staff can 86 every signature, or rename the category out from under us.
  // Render nothing rather than index into nothing — reading `drinks[0].id` on
  // an empty array is what broke the production build.
  if (!active) return null;

  return (
    <div className="lineup" onKeyDown={onKey}>
      {/* Colour wash keyed to the active drink */}
      <AnimatePresence>
        <motion.div
          key={active.id}
          className="lineup__wash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          aria-hidden
        />
      </AnimatePresence>

      <div className="lineup__grid">
        {/* ---- spec sheet ---- */}
        <div className="spec">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                className="spec__index"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {String(index + 1).padStart(2, "0")} / {String(drinks.length).padStart(2, "0")}
              </motion.p>

              <motion.h2
                className="spec__name"
                initial={reduce ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.04 }}
              >
                {active.name}
              </motion.h2>

              <motion.p
                className="spec__tags"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
              >
                {active.tags}
              </motion.p>

              <ul className="spec__build">
                {active.build?.map((row, i) => (
                  <motion.li
                    key={row.what}
                    initial={reduce ? false : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.55,
                      ease: EASE,
                      delay: 0.16 + i * 0.06,
                    }}
                  >
                    <span className="spec__measure">{row.measure}</span>
                    <span className="spec__what">{row.what}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                className="spec__meta"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.42 }}
              >
                <div>
                  <span>Glass</span>
                  <span>{active.glass}</span>
                </div>
                <div>
                  <span>Garnish</span>
                  <span>{active.garnish}</span>
                </div>
                {typeof active.price === "number" && (
                  <div>
                    <span>Price</span>
                    <span>{formatPrice(active.price)}</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Meters persist across drinks and animate between values, which
              makes the difference between two cocktails legible. */}
          <div className="meters">
            {AXES.map((axis, i) => {
              const v = active.taste?.[axis.key] ?? 0;
              return (
                <div className="meter" key={axis.key}>
                  <span className="meter__label">{axis.label}</span>
                  <div className="meter__track">
                    <motion.span
                      className="meter__fill"
                      animate={{ scaleX: v / 5 }}
                      initial={false}
                      transition={{
                        duration: 0.75,
                        ease: EASE,
                        delay: reduce ? 0 : i * 0.05,
                      }}
                    />
                  </div>
                  <span className="meter__value">{v}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- featured plate ---- */}
        <div className="plate">
          <AnimatePresence mode="popLayout">
            <motion.figure
              key={active.id}
              layoutId={reduce ? undefined : `drink-${active.id}`}
              className="plate__figure"
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <Image
                src={active.image ?? "/images/hero-pour.jpg"}
                alt={active.name}
                fill
                priority={index === 0}
                sizes="(max-width: 860px) 90vw, 40vw"
                quality={72}
              />
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>

      {/* ---- the rail ---- */}
      <div className="rail" ref={railRef} role="tablist" aria-label="Signature cocktails">
        {drinks.map((d, i) => (
          <button
            key={d.id}
            data-slot={i}
            role="tab"
            aria-selected={i === index}
            className={`rail__slot ${i === index ? "is-active" : ""}`}
            onClick={() => pick(i, true)}
            // Hover-select only where there is a real cursor; on touch the
            // synthetic mouseenter fires on tap and can select a neighbour.
            onMouseEnter={fine && !reduce ? () => pick(i, true) : undefined}
          >
            <span className="rail__thumb">
              <Image
                src={d.image ?? "/images/hero-pour.jpg"}
                alt=""
                fill
                sizes="120px"
                quality={55}
              />
            </span>
            <span className="rail__name">{d.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
