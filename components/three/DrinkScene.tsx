"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import DrinkGlass, { GLASS_TOP, type Layer } from "./DrinkGlass";
import IngredientOrb, { orbHome } from "./IngredientOrb";
import {
  HoneyRibbon,
  LimeWheel,
  PourStream,
  Splash,
  type ActivePour,
} from "./PourEffects";
import { INGREDIENTS, type IngredientId } from "@/content/drink";

/**
 * Presentational only.
 *
 * What is in the glass is decided by scroll position, in the parent. Keeping
 * this stateless means a scroll step re-renders one small tree instead of
 * re-running builder logic inside the canvas, and it let the whole
 * pointer-projection drag path go away.
 */

type Props = {
  poured: IngredientId[];
  lowPower: boolean;
  /** Render loop stops when the stage leaves the viewport. */
  active: boolean;
};

const MOUTH = new THREE.Vector3(0, GLASS_TOP * 0.9, 0);

function Contents({
  poured,
  lowPower,
  narrow,
}: {
  poured: IngredientId[];
  lowPower: boolean;
  narrow: boolean;
}) {
  const [pours, setPours] = useState<ActivePour[]>([]);
  const [limeAt, setLimeAt] = useState<number | null>(null);
  const clock = useRef(0);
  const seen = useRef<Set<IngredientId>>(new Set());

  useFrame((state) => {
    clock.current = state.clock.elapsedTime;
  });

  // Fire pour effects for anything newly added; clear them scrolling back up.
  useEffect(() => {
    if (poured.length === 0) {
      if (seen.current.size > 0) {
        seen.current.clear();
        setPours([]);
        setLimeAt(null);
      }
      return;
    }

    poured.forEach((id) => {
      if (seen.current.has(id)) return;
      seen.current.add(id);
      const ing = INGREDIENTS.find((i) => i.id === id);
      if (!ing) return;
      if (ing.decorative) {
        setLimeAt(clock.current);
      } else {
        setPours((p) => [
          ...p,
          {
            key: Math.random(),
            color: new THREE.Color(ing.color),
            density: ing.density,
            from: orbHome(ing, narrow),
            startedAt: clock.current,
          },
        ]);
      }
    });

    seen.current.forEach((id) => {
      if (!poured.includes(id)) seen.current.delete(id);
    });
    if (!poured.includes("garnish")) setLimeAt(null);
  }, [poured, narrow]);

  useFrame(() => {
    if (pours.length === 0) return;
    const alive = pours.filter((p) => clock.current - p.startedAt < 2.1);
    if (alive.length !== pours.length) setPours(alive);
  });

  const core = useMemo(
    () =>
      poured.filter((id) => !INGREDIENTS.find((i) => i.id === id)?.decorative),
    [poured]
  );

  const layers: Layer[] = useMemo(() => {
    const list = core
      .map((id) => INGREDIENTS.find((i) => i.id === id)!)
      .sort((a, b) => b.density - a.density);
    return list.map((i) => ({
      color: new THREE.Color(i.color),
      height: i.volume,
      density: i.density,
    }));
  }, [core]);

  const fill = useMemo(
    () =>
      Math.min(
        core.reduce(
          (s, id) => s + (INGREDIENTS.find((i) => i.id === id)?.volume ?? 0),
          0
        ),
        0.92
      ),
    [core]
  );

  const frost = poured.includes("ice") ? 1 : 0;
  const settle = pours.length > 0 ? 1 : 0.25;

  return (
    <>
      <group
        position={narrow ? [0, -1.5, 0] : [1.75, -1.55, 0]}
        scale={narrow ? 0.62 : 0.8}
      >
        <DrinkGlass
          layers={layers}
          fill={fill}
          frost={frost}
          settle={settle}
          lowPower={lowPower}
        />

        {pours.map((p) => (
          <group key={p.key}>
            <PourStream pour={p} fill={fill} />
            <Splash pour={p} fill={fill} />
            {p.density > 0.85 && <HoneyRibbon pour={p} fill={fill} />}
          </group>
        ))}

        {limeAt !== null && <LimeWheel droppedAt={limeAt} fill={fill} />}

        {INGREDIENTS.map((ing) => (
          <IngredientOrb
            key={ing.id}
            ingredient={ing}
            poured={poured.includes(ing.id)}
            target={poured.includes(ing.id) ? MOUTH : orbHome(ing, narrow)}
            lowPower={lowPower}
          />
        ))}
      </group>

      <ambientLight intensity={0.75} />
      <spotLight
        position={[3.4, 6.2, 3.2]}
        angle={0.55}
        penumbra={0.9}
        intensity={70}
        color="#ffd9a8"
        castShadow={!lowPower}
        shadow-mapSize={lowPower ? 256 : 1024}
      />
      <pointLight position={[-2.8, 1.6, -2.4]} intensity={16} color="#d9a862" />
      <pointLight position={[2.6, 0.6, -2.8]} intensity={9} color="#ff6a3d" />

      <Environment resolution={lowPower ? 96 : 256}>
        <Lightformer form="rect" intensity={9} color="#ffe2bd" position={[0, 5, 2]} scale={[7, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={6} color="#d9a862" position={[-4, 1.4, -2]} scale={[4, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={4.5} color="#ff7a45" position={[3.6, 0.6, -3]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#7fa8c9" position={[0, -2.4, 1]} scale={[6, 2, 1]} target={[0, 0, 0]} />
      </Environment>

      {!lowPower && (
        <ContactShadows
          position={[0, -1.37, 0]}
          opacity={0.6}
          scale={8}
          blur={2.8}
          far={4}
          color="#000000"
        />
      )}
    </>
  );
}

export default function DrinkScene({ poured, lowPower, active }: Props) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(max-width: 860px)");
    setNarrow(q.matches);
    const on = () => setNarrow(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  return (
    <div className="drink-scene">
      <Canvas
        // Phones pay for transmission per pixel, so cap hard there.
        dpr={lowPower ? [1, 1.25] : [1, 2]}
        // No GPU work at all once the stage has scrolled away.
        frameloop={active ? "always" : "never"}
        gl={{
          antialias: !lowPower,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.3, 8.2], fov: 32 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Contents poured={poured} lowPower={lowPower} narrow={narrow} />
        </Suspense>
      </Canvas>
    </div>
  );
}
