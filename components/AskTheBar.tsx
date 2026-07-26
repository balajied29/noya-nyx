"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { MenuCategory } from "@/content";

/**
 * Three questions, one drink.
 *
 * Each answer carries a weight for a flavour axis. Rather than hard-coding
 * results, we score the signature list so the recommendation keeps working
 * when the menu is edited from the dashboard.
 */

type Axis = "intensity" | "sweetness" | "smoke";

const QUESTIONS: {
  prompt: string;
  options: { label: string; weights: Partial<Record<Axis, number>> }[];
}[] = [
  {
    prompt: "How is the night going?",
    options: [
      { label: "Slow burn", weights: { intensity: 1, smoke: 1 } },
      { label: "Sharp and bright", weights: { intensity: 2, sweetness: -1 } },
      { label: "Full throttle", weights: { intensity: 3, smoke: 2 } },
    ],
  },
  {
    prompt: "Pick a temperature.",
    options: [
      { label: "Cold glass, colder air", weights: { intensity: 2 } },
      { label: "Something warming", weights: { smoke: 2, sweetness: 1 } },
      { label: "Somewhere in between", weights: { sweetness: 1 } },
    ],
  },
  {
    prompt: "And the last thing you ate?",
    options: [
      { label: "Chilli and smoke", weights: { smoke: 3 } },
      { label: "Something sweet", weights: { sweetness: 3 } },
      { label: "Nothing yet", weights: { intensity: 1 } },
    ],
  },
];

/** Rough flavour fingerprints, matched by ingredient keywords. */
const KEYWORDS: Record<Axis, string[]> = {
  smoke: ["smoke", "peated", "mezcal", "charcoal", "til", "tonka"],
  sweetness: ["jaggery", "honey", "syrup", "coconut", "milk", "sugar"],
  intensity: ["bhut", "jolokia", "pepper", "bitter", "saline", "lemon", "lime"],
};

function scoreItem(ingredients: string[], target: Record<Axis, number>) {
  const text = ingredients.join(" ").toLowerCase();
  let score = 0;
  (Object.keys(KEYWORDS) as Axis[]).forEach((axis) => {
    const hits = KEYWORDS[axis].filter((k) => text.includes(k)).length;
    score += hits * (target[axis] ?? 0);
  });
  return score;
}

export default function AskTheBar({ menu }: { menu: MenuCategory[] }) {
  const [step, setStep] = useState(0);
  const [totals, setTotals] = useState<Record<Axis, number>>({
    intensity: 0,
    sweetness: 0,
    smoke: 0,
  });
  const reduce = useReducedMotion();

  const pool =
    menu.find((c) => c.id === "signatures")?.items ??
    menu.flatMap((c) => c.items);

  const answer = (weights: Partial<Record<Axis, number>>) => {
    setTotals((prev) => ({
      intensity: prev.intensity + (weights.intensity ?? 0),
      sweetness: prev.sweetness + (weights.sweetness ?? 0),
      smoke: prev.smoke + (weights.smoke ?? 0),
    }));
    setStep((s) => s + 1);
  };

  const reset = () => {
    setStep(0);
    setTotals({ intensity: 0, sweetness: 0, smoke: 0 });
  };

  const done = step >= QUESTIONS.length;
  const pick = done
    ? [...pool].sort((a, b) => scoreItem(b.ingredients, totals) - scoreItem(a.ingredients, totals))[0]
    : null;

  const fade = {
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? undefined : { opacity: 0, y: -12 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  };

  return (
    <div className="ask__panel">
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={step} {...fade} style={{ display: "grid", gap: "1.4rem" }}>
            <div className="ask__progress" aria-hidden>
              {QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`ask__pip ${i <= step ? "is-done" : ""}`}
                />
              ))}
            </div>
            <p className="micro">
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <p className="ask__question">{QUESTIONS[step].prompt}</p>
            <div className="ask__options">
              {QUESTIONS[step].options.map((opt) => (
                <button
                  key={opt.label}
                  className="ask__option"
                  onClick={() => answer(opt.weights)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="result" {...fade} className="ask__result">
            <p className="micro">The bar suggests</p>
            <p className="ask__result-name">{pick?.name}</p>
            <p className="list__ingredients">
              {pick?.ingredients.join(" · ")}
            </p>
            <p className="body-copy">
              Ask for it by name, or tell the bartender what you actually
              feel like. They will not be offended.
            </p>
            <button className="ask__reset" onClick={reset}>
              Start again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
