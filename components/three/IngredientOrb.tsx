"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Ingredient } from "@/content/drink";

export const ORB_RING_RADIUS = 1.85;
export const ORB_HEIGHT = 1.6;

/**
 * Orbs sit on an ellipse around the glass. On a phone the viewport is far
 * narrower than it is tall, so a circular ring pushed the outer orbs off
 * screen — squash it horizontally and stretch it vertically there.
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
  /** Once poured the orb flies to the mouth of the glass and vanishes. */
  poured: boolean;
  target: THREE.Vector3;
  lowPower: boolean;
};

export default function IngredientOrb({
  ingredient,
  poured,
  target,
  lowPower,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const floatGroup = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const gone = useRef(0);
  const seed = useMemo(() => Math.random() * 10, []);
  const color = useMemo(
    () => new THREE.Color(ingredient.color),
    [ingredient.color]
  );

  useFrame((state, delta) => {
    if (!group.current || !floatGroup.current) return;
    const d = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    // Poured orbs travel to the mouth, then shrink out of existence.
    group.current.position.lerp(target, poured ? 0.12 : 0.09);

    gone.current = THREE.MathUtils.damp(gone.current, poured ? 1 : 0, 3.5, d);

    floatGroup.current.position.y = poured
      ? 0
      : Math.sin(t * 0.9 + seed) * 0.045;
    floatGroup.current.scale.setScalar(Math.max(1 - gone.current, 0.001));

    if (inner.current) {
      inner.current.rotation.y = t * 0.5 + seed;
      inner.current.rotation.x = Math.sin(t * 0.4 + seed) * 0.3;
    }
  });

  return (
    <group ref={group} position={target.clone()}>
      <group ref={floatGroup}>
        <mesh ref={inner} renderOrder={6}>
          <sphereGeometry args={[0.2, lowPower ? 16 : 32, lowPower ? 16 : 32]} />
          <meshPhysicalMaterial
            color={color}
            roughness={0.16}
            metalness={0.05}
            transmission={lowPower ? 0 : 0.45}
            thickness={0.5}
            ior={1.4}
            emissive={new THREE.Color(ingredient.glow ?? ingredient.color)}
            emissiveIntensity={0.45}
            transparent={!lowPower}
          />
        </mesh>

        <mesh renderOrder={5} scale={1.3}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.09}
            depthWrite={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>

      </group>
    </group>
  );
}
