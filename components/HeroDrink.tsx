"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  INGREDIENTS,
  SIGNATURE,
  isSignature,
  nameFor,
  type IngredientId,
} from "@/content/drink";
import type { BuilderState } from "./three/DrinkScene";

const DrinkScene = dynamic(() => import("./three/DrinkScene"), {
  ssr: false,
  loading: () => null,
});

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

export default function HeroDrink() {
  const [caps, setCaps] = useState<{ show: boolean; lowPower: boolean } | null>(
    null
  );
  const [state, setState] = useState<BuilderState>({
    poured: [],
    matched: false,
  });
  const [resetSignal, setResetSignal] = useState(0);
  const api = useRef<{ add: (id: IngredientId) => void } | null>(null);
  const onApi = useCallback(
    (a: { add: (id: IngredientId) => void }) => {
      api.current = a;
    },
    []
  );

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

  const onChange = useCallback((s: BuilderState) => setState(s), []);

  const core = useMemo(
    () =>
      state.poured.filter(
        (id) => !INGREDIENTS.find((i) => i.id === id)?.decorative
      ) as IngredientId[],
    [state.poured]
  );

  const matched = isSignature(core);
  const name = matched ? SIGNATURE.name : nameFor(core);
  const started = state.poured.length > 0;

  if (!caps?.show) return null;

  return (
    <div className="drink-hero">
      <DrinkScene
        lowPower={caps.lowPower}
        onChange={onChange}
        resetSignal={resetSignal}
        onApi={onApi}
      />

      {/* Read-out: always names what is in the glass. No failure state. */}
      <div className="drink-readout">
        {/*
          Phone control surface. The 3D labels sit around the glass, which
          overlaps and overflows at narrow aspect ratios — these are real
          buttons, and they live in normal flow so they can never collide
          with the read-out as it grows.
        */}
        <div className="drink-chips">
          {INGREDIENTS.filter((i) => !state.poured.includes(i.id)).map((ing) => (
            <button
              key={ing.id}
              className="drink-chip"
              style={{ ["--chip" as string]: ing.color }}
              onClick={() => api.current?.add(ing.id)}
            >
              <span className="drink-chip__dot" />
              {ing.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${name}-${matched}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="drink-readout__eyebrow">
              {matched
                ? "The house serve"
                : started
                  ? "Your pour"
                  : "Build a drink"}
            </p>
            <p
              className={`drink-readout__name ${
                matched ? "is-signature" : ""
              }`}
            >
              {started ? name : "Drag an ingredient in"}
            </p>
            {matched ? (
              <p className="drink-readout__blurb">{SIGNATURE.blurb}</p>
            ) : (
              <p className="drink-readout__blurb">
                {started
                  ? "Keep going — every combination pours."
                  : "Six things on the shelf. Four of them make something we actually serve."}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {matched && (
            <motion.div
              className="drink-cta"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
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

        {started && (
          <button
            className="drink-reset"
            onClick={() => {
              setResetSignal((n) => n + 1);
              setState({ poured: [], matched: false });
            }}
          >
            Empty the glass
          </button>
        )}
      </div>
    </div>
  );
}
