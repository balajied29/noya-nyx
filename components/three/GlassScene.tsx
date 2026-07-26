"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import CocktailGlass from "./CocktailGlass";

/**
 * Interactive hero object.
 *
 * Drag to spin; it keeps spinning and eases back to rest. The pointer also
 * parallaxes the camera slightly, so the scene feels responsive even before
 * you grab it.
 */

type RigProps = {
  spinRef: React.RefObject<number>;
  targetRef: React.RefObject<number>;
  pointer: React.RefObject<{ x: number; y: number }>;
  interactive: boolean;
  lowPower: boolean;
  narrow: boolean;
};

function Rig({
  spinRef,
  targetRef,
  pointer,
  interactive,
  lowPower,
  narrow,
}: RigProps) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);

    if (group.current) {
      // Free spin decays toward a slow idle rotation.
      const idle = 0.16;
      targetRef.current += (spinRef.current + idle) * d;
      group.current.rotation.y = targetRef.current;
      // Friction on the flick velocity.
      spinRef.current = THREE.MathUtils.damp(spinRef.current, 0, 1.8, d);
    }

    if (interactive) {
      // Gentle camera parallax toward the cursor.
      const p = pointer.current;
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        p.x * 0.45,
        3,
        d
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        1.0 + p.y * 0.3,
        3,
        d
      );
      camera.lookAt(0, 0.82, 0);
    }
  });

  // On wide screens the object sits right of centre so the headline keeps the
  // left half to itself; on a phone the canvas is its own band, so centre it.
  return (
    <group
      position={narrow ? [0, -0.1, 0] : [1.0, -0.05, 0]}
      scale={narrow ? 0.8 : 0.6}
    >
      <group ref={group}>
        <CocktailGlass lowPower={lowPower} spinRef={spinRef} />
      </group>
    </group>
  );
}

export default function GlassScene({ lowPower = false }: { lowPower?: boolean }) {
  const spinRef = useRef(0);
  const targetRef = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastX = useRef(0);
  const [reduced, setReduced] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);

    const nq = window.matchMedia("(max-width: 860px)");
    setNarrow(nq.matches);
    const onNarrow = () => setNarrow(nq.matches);
    nq.addEventListener("change", onNarrow);

    return () => {
      mq.removeEventListener("change", on);
      nq.removeEventListener("change", onNarrow);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    };
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    spinRef.current = THREE.MathUtils.clamp(
      spinRef.current + dx * 0.012,
      -7,
      7
    );
  };

  const endDrag = () => {
    dragging.current = false;
  };

  return (
    <div
      className="glass-scene"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      aria-hidden
    >
      <Canvas
        // Cap DPR — transmission at 3x on a phone is the main cost.
        dpr={lowPower ? [1, 1.5] : [1, 2]}
        gl={{
          antialias: !lowPower,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 1.0, 6.5], fov: 30 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Rig
            spinRef={spinRef}
            targetRef={targetRef}
            pointer={pointer}
            interactive={!reduced}
            lowPower={lowPower}
            narrow={narrow}
          />

          {/* Candlelit key from above-right, brass rim from behind. */}
          <ambientLight intensity={0.7} />
          <spotLight
            position={[3.2, 5.4, 2.6]}
            angle={0.5}
            penumbra={0.9}
            intensity={60}
            color="#ffd9a8"
            castShadow={!lowPower}
            shadow-mapSize={lowPower ? 256 : 1024}
          />
          <pointLight position={[-2.6, 1.4, -2.2]} intensity={14} color="#d9a862" />
          <pointLight position={[2.4, 0.4, -2.6]} intensity={8} color="#ff6a3d" />

          {/*
            Lightformers instead of an HDR preset — drei's presets fetch from a
            CDN, which would add a hard external dependency to the hero.
          */}
          <Environment resolution={lowPower ? 128 : 256}>
            <Lightformer
              form="rect"
              intensity={9}
              color="#ffe2bd"
              position={[0, 4, 2]}
              scale={[6, 3, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={6}
              color="#d9a862"
              position={[-4, 1.2, -2]}
              scale={[4, 4, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="circle"
              intensity={4.5}
              color="#ff7a45"
              position={[3.4, 0.4, -3]}
              scale={[3, 3, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={2.2}
              color="#7fa8c9"
              position={[0, -2, 1]}
              scale={[6, 2, 1]}
              target={[0, 0, 0]}
            />
          </Environment>

          {!lowPower && (
            <ContactShadows
              position={[0, -0.02, 0]}
              opacity={0.65}
              scale={7}
              blur={2.6}
              far={3}
              color="#000000"
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
