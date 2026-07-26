"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import { INGREDIENTS, type IngredientId, type Ingredient } from "@/content/drink";
import { playChime, playPour, primeAudio } from "@/lib/chime";

export type BuilderState = {
  poured: IngredientId[];
  matched: boolean;
};

type SceneProps = {
  lowPower: boolean;
  onChange: (s: BuilderState) => void;
  resetSignal: number;
  /** Lets HTML controls outside the canvas pour an ingredient. */
  onApi?: (api: { add: (id: IngredientId) => void }) => void;
};

/** Screen-space drag, projected onto the plane the orbs live on. */
function useDragPlane() {
  return useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.2), []);
}

function Contents({
  lowPower,
  onChange,
  resetSignal,
  onApi,
  narrow,
}: SceneProps & { narrow: boolean }) {
  const { camera, raycaster, gl } = useThree();
  const plane = useDragPlane();

  const [poured, setPoured] = useState<IngredientId[]>([]);
  const [dragId, setDragId] = useState<IngredientId | null>(null);
  const [armed, setArmed] = useState(false);
  const [pours, setPours] = useState<ActivePour[]>([]);
  const [limeAt, setLimeAt] = useState<number | null>(null);
  const matchedRef = useRef(false);

  const rig = useRef<THREE.Group>(null);
  const positions = useRef<Map<IngredientId, THREE.Vector3>>(new Map());
  if (positions.current.size === 0) {
    INGREDIENTS.forEach((i) => positions.current.set(i.id, orbHome(i, narrow)));
  }
  const [, force] = useState(0);
  const clock = useRef(0);
  useFrame((state) => {
    clock.current = state.clock.elapsedTime;
  });

  useEffect(() => {
    INGREDIENTS.forEach((i) => {
      if (!poured.includes(i.id)) {
        positions.current.set(i.id, orbHome(i, narrow));
      }
    });
    force((n) => n + 1);
    // Only re-home on breakpoint change, not on every pour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow]);

  // Reset
  useEffect(() => {
    if (resetSignal === 0) return;
    setPoured([]);
    setPours([]);
    setLimeAt(null);
    setDragId(null);
    matchedRef.current = false;
    INGREDIENTS.forEach((i) => positions.current.set(i.id, orbHome(i, narrow)));
    force((n) => n + 1);
  }, [resetSignal, narrow]);

  const core = useMemo(
    () =>
      poured.filter(
        (id) => !INGREDIENTS.find((i) => i.id === id)?.decorative
      ),
    [poured]
  );

  // Layers are ordered by density: heaviest at the bottom.
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
    () => Math.min(core.reduce((s, id) => s + (INGREDIENTS.find((i) => i.id === id)?.volume ?? 0), 0), 0.92),
    [core]
  );

  const frost = poured.includes("ice") ? 1 : 0;
  const settle = pours.length > 0 ? 1 : 0.25;

  const commit = useCallback(
    (ing: Ingredient) => {
      if (poured.includes(ing.id)) return;
      primeAudio();
      playPour(ing.density);

      const next = [...poured, ing.id];
      setPoured(next);

      if (ing.decorative) {
        setLimeAt(clock.current);
      } else {
        setPours((p) => [
          ...p,
          {
            key: Date.now() + Math.random(),
            color: new THREE.Color(ing.color),
            density: ing.density,
            from: positions.current.get(ing.id)!.clone(),
            startedAt: clock.current,
          },
        ]);
      }
    },
    [poured]
  );

  // Report state up for the HTML overlay.
  useEffect(() => {
    onChange({ poured, matched: matchedRef.current });
  }, [poured, onChange]);

  // Chime once, when the pour becomes the signature.
  useEffect(() => {
    const isSig =
      core.length === 4 &&
      ["spirit", "honey", "citrus", "ice"].every((id) =>
        core.includes(id as IngredientId)
      );
    if (isSig && !matchedRef.current) {
      matchedRef.current = true;
      const t = window.setTimeout(() => {
        playChime();
        onChange({ poured, matched: true });
      }, 900);
      return () => window.clearTimeout(t);
    }
    if (!isSig) matchedRef.current = false;
  }, [core, poured, onChange]);

  // Retire finished pour effects.
  useFrame(() => {
    if (pours.length === 0) return;
    const alive = pours.filter((p) => clock.current - p.startedAt < 2.1);
    if (alive.length !== pours.length) setPours(alive);
  });

  // ---- drag handling -------------------------------------------------
  // Orb positions are in the rig's local space, so the mouth test is too.
  const withinMouth = useCallback(
    (p: THREE.Vector3) => Math.hypot(p.x, p.y - GLASS_TOP * 0.82) < 1.35,
    []
  );
  const pointerNdc = useRef(new THREE.Vector2());
  const hit = useRef(new THREE.Vector3());

  const project = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointerNdc.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -(((clientY - rect.top) / rect.height) * 2 - 1)
      );
      raycaster.setFromCamera(pointerNdc.current, camera);
      raycaster.ray.intersectPlane(plane, hit.current);
      if (rig.current) rig.current.worldToLocal(hit.current);
      return hit.current;
    },
    [camera, gl, plane, raycaster]
  );

  useEffect(() => {
    if (!dragId) return;
    const el = gl.domElement;

    const move = (e: PointerEvent) => {
      const p = project(e.clientX, e.clientY);
      positions.current.set(dragId, p.clone());
      // Over the mouth of the glass?
      const near = withinMouth(p);
      setArmed(near);
      force((n) => n + 1);
    };

    const up = () => {
      const p = positions.current.get(dragId)!;
      const near = withinMouth(p);
      const ing = INGREDIENTS.find((i) => i.id === dragId)!;
      if (near) {
        commit(ing);
      } else {
        positions.current.set(dragId, orbHome(ing, narrow));
      }
      setDragId(null);
      setArmed(false);
      force((n) => n + 1);
    };

    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragId, gl, project, commit, narrow, withinMouth]);

  const onGrab = useCallback((id: string) => {
    setDragId(id as IngredientId);
  }, []);

  const onActivate = useCallback(
    (id: string) => {
      const ing = INGREDIENTS.find((i) => i.id === id);
      if (ing) commit(ing);
    },
    [commit]
  );

  // Republish whenever commit changes, so the handle never closes over stale
  // state — the chip row must pour the same way the orbs do.
  useEffect(() => {
    onApi?.({ add: (id: IngredientId) => onActivate(id) });
  }, [onApi, onActivate]);

  return (
    <>
      <group
        ref={rig}
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
            used={poured.includes(ing.id)}
            dragging={dragId === ing.id}
            armed={armed && dragId === ing.id}
            position={positions.current.get(ing.id)!}
            lowPower={lowPower}
            hideLabel={narrow}
            onGrab={onGrab}
            onActivate={onActivate}
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

      <Environment resolution={lowPower ? 128 : 256}>
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

export default function DrinkScene({
  lowPower,
  onChange,
  resetSignal,
  onApi,
}: SceneProps) {
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
        dpr={lowPower ? [1, 1.5] : [1, 2]}
        gl={{ antialias: !lowPower, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.3, 8.2], fov: 32 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Contents
            lowPower={lowPower}
            onChange={onChange}
            resetSignal={resetSignal}
            onApi={onApi}
            narrow={narrow}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
