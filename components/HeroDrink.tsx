"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  INGREDIENTS,
  POUR_SEQUENCE,
  SIGNATURE,
  type IngredientId,
} from "@/content/drink";
import { playChime, playPour, primeAudio } from "@/lib/chime";

const DrinkScene = dynamic(() => import("./three/DrinkScene"), {
  ssr: false,
  loading: () => null,
});

const STEPS = POUR_SEQUENCE.length;

function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export default function HeroDrink({
  stageRef,
}: {
  stageRef: React.RefObject<HTMLElement | null>;
}) {
  const [caps, setCaps] = useState<{ show: boolean; lowPower: boolean } | null>(
    null
  );
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(true);
  const stepRef = useRef(0);
  const soundedRef = useRef(0);

  useEffect(() => {
    if (!detectWebGL()) return setCaps({ show: false, lowPower: false });
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true;
    if (saveData) return setCaps({ show: false, lowPower: false });

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 861;
    const cores = navigator.hardwareConcurrency ?? 4;
    setCaps({ show: true, lowPower: coarse || narrow || cores <= 4 });
  }, []);

  /**
   * Scroll drives the build.
   *
   * The handler fires on every scroll event but only calls setState when the
   * step index actually changes, so scrolling the whole stage causes a handful
   * of re-renders rather than hundreds — and layout reads are one
   * getBoundingClientRect, inside rAF.
   */
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !caps?.show) return;

    let ticking = false;
    const measure = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      if (travel <= 0) return;
      const p = Math.min(Math.max(-rect.top / travel, 0), 1);
      // The final stretch holds on the finished drink so the CTA can be read.
      const next = Math.min(STEPS, Math.floor(p * (STEPS + 1)));
      if (next !== stepRef.current) {
        stepRef.current = next;
        setStep(next);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [stageRef, caps?.show]);

  // Stop rendering entirely once the stage is off screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !caps?.show) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stageRef, caps?.show]);

  const poured = useMemo(
    () => POUR_SEQUENCE.slice(0, step) as IngredientId[],
    [step]
  );
  const complete = step >= STEPS;
  const current = step > 0 ? POUR_SEQUENCE[step - 1] : null;
  const currentIng = INGREDIENTS.find((i) => i.id === current);

  // Sound follows the scroll, forwards only, and never before a gesture.
  useEffect(() => {
    if (step === soundedRef.current) return;
    const forward = step > soundedRef.current;
    soundedRef.current = step;
    if (!forward || step === 0) return;
    primeAudio();
    const ing = INGREDIENTS.find((i) => i.id === POUR_SEQUENCE[step - 1]);
    if (ing) playPour(ing.density);
    if (step >= STEPS) {
      const t = window.setTimeout(playChime, 700);
      return () => window.clearTimeout(t);
    }
  }, [step]);

  const onSkip = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    window.scrollTo({
      top: el.offsetTop + el.offsetHeight - window.innerHeight,
      behavior: "smooth",
    });
  }, [stageRef]);

  if (!caps?.show) return null;

  return (
    <div className="drink-hero">
      <DrinkScene poured={poured} lowPower={caps.lowPower} active={active} />

      <div className="drink-readout">
        <div className="pour-rail" aria-hidden>
          {POUR_SEQUENCE.map((id, i) => (
            <span
              key={id}
              className={`pour-rail__tick ${i < step ? "is-done" : ""}`}
              style={{
                ["--tick" as string]:
                  INGREDIENTS.find((x) => x.id === id)?.color ?? "#fff",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={complete ? "done" : (current ?? "idle")}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="drink-readout__eyebrow">
              {complete
                ? "The house serve"
                : step === 0
                  ? "Build the house serve"
                  : `Pour ${step} of ${STEPS}`}
            </p>
            <p
              className={`drink-readout__name ${complete ? "is-signature" : ""}`}
            >
              {complete
                ? SIGNATURE.name
                : step === 0
                  ? "Scroll to pour"
                  : (currentIng?.label ?? "")}
            </p>
            <p className="drink-readout__blurb">
              {complete
                ? SIGNATURE.blurb
                : step === 0
                  ? "Six pours, in order. Keep scrolling and the glass fills."
                  : (currentIng?.note ?? "")}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {complete && (
            <motion.div
              className="drink-cta"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.25,
              }}
            >
              <a className="slab slab--brass" href={SIGNATURE.primaryCta.href}>
                <span>{SIGNATURE.primaryCta.label}</span>
                <span aria-hidden>→</span>
              </a>
              <a className="slab" href={SIGNATURE.secondaryCta.href}>
                <span>{SIGNATURE.secondaryCta.label}</span>
                <span aria-hidden>↗</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {!complete && (
          <button className="drink-reset" onClick={onSkip}>
            Skip the build
          </button>
        )}
      </div>
    </div>
  );
}
