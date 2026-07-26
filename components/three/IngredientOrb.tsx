"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Ingredient } from "@/content/drink";

export const ORB_RING_RADIUS = 1.85;
export const ORB_HEIGHT = 1.6;

/**
 * Orbs sit on an ellipse around the glass. On a phone the viewport is far
 * narrower than it is tall, so a circular ring pushed the outer orbs off
 * screen entirely — squash it horizontally and stretch it vertically there.
 */
export function orbHome(ing: Ingredient, narrow = false): THREE.Vector3 {
  const a = (ing.angle * Math.PI) / 180;
  const rx = narrow ? 1.05 : ORB_RING_RADIUS;
  const ry = narrow ? 1.5 : 0.55;
  return new THREE.Vector3(
    Math.cos(a) * rx,
    ORB_HEIGHT + Math.sin(a) * ry,
    Math.sin(a) * 0.42
  );
}

type Props = {
  ingredient: Ingredient;
  used: boolean;
  dragging: boolean;
  armed: boolean;
  position: THREE.Vector3;
  lowPower: boolean;
  hideLabel?: boolean;
  onGrab: (id: string, e: PointerEvent) => void;
  onActivate: (id: string) => void;
};

export default function IngredientOrb({
  ingredient,
  used,
  dragging,
  armed,
  position,
  lowPower,
  hideLabel = false,
  onGrab,
  onActivate,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const floatGroup = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 10, []);
  const color = useMemo(
    () => new THREE.Color(ingredient.color),
    [ingredient.color]
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const d = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    group.current.position.lerp(position, dragging ? 0.55 : 0.12);

    if (floatGroup.current) {
      // Absolute offset, not accumulated — settles instead of drifting.
      floatGroup.current.position.y = dragging
        ? 0
        : Math.sin(t * 0.9 + seed) * 0.045;

      const targetScale = used ? 0.001 : dragging ? 1.22 : armed ? 1.12 : 1;
      const s = THREE.MathUtils.damp(
        floatGroup.current.scale.x,
        targetScale,
        used ? 6 : 4,
        d
      );
      floatGroup.current.scale.setScalar(s);
    }

    if (inner.current) {
      inner.current.rotation.y = t * 0.5 + seed;
      inner.current.rotation.x = Math.sin(t * 0.4 + seed) * 0.3;
    }
  });

  if (used) return null;

  return (
    <group ref={group} position={position.clone()}>
     <group ref={floatGroup}>
      {/* Generous invisible hit area — the visible orb is small. */}
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          onGrab(ingredient.id, e.nativeEvent as PointerEvent);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <sphereGeometry args={[0.36, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* The bead itself */}
      <mesh ref={inner} renderOrder={6}>
        <sphereGeometry args={[0.2, lowPower ? 18 : 34, lowPower ? 18 : 34]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.16}
          metalness={0.05}
          transmission={lowPower ? 0 : 0.45}
          thickness={0.5}
          ior={1.4}
          emissive={new THREE.Color(ingredient.glow ?? ingredient.color)}
          emissiveIntensity={armed || dragging ? 0.85 : 0.4}
          transparent={!lowPower}
          opacity={1}
        />
      </mesh>

      {/* Halo */}
      <mesh renderOrder={5} scale={armed || dragging ? 1.5 : 1.25}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={armed || dragging ? 0.16 : 0.07}
          depthWrite={false}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {!hideLabel && (
      <Html
        center
        distanceFactor={9}
        position={[0, -0.44, 0]}
        wrapperClass="orb-html"
        zIndexRange={[20, 0]}
      >
        <button
          className={`orb-label ${dragging ? "is-dragging" : ""} ${
            armed ? "is-armed" : ""
          }`}
          onClick={() => onActivate(ingredient.id)}
          // Pointer-down is handled by the 3D hit area; this is the
          // keyboard/tap path so the builder works without dragging.
          type="button"
        >
          <span className="orb-label__name">{ingredient.label}</span>
          <span className="orb-label__note">{ingredient.note}</span>
        </button>
      </Html>
      )}
     </group>
    </group>
  );
}
