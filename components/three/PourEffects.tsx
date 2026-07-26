"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLASS_BOTTOM, GLASS_TOP, radiusAt } from "./DrinkGlass";

export type ActivePour = {
  key: number;
  color: THREE.Color;
  density: number;
  from: THREE.Vector3;
  startedAt: number;
};

const POUR_SECONDS = 1.15;

/** A tapered stream from the orb's last position into the mouth of the glass. */
export function PourStream({
  pour,
  fill,
}: {
  pour: ActivePour;
  fill: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.035, 0.075, 1, 10, 1, true);
    return g;
  }, []);

  useFrame((state) => {
    if (!mesh.current || !mat.current) return;
    const t = (state.clock.elapsedTime - pour.startedAt) / POUR_SECONDS;
    if (t > 1) {
      mesh.current.visible = false;
      return;
    }
    mesh.current.visible = true;

    const surfaceY = GLASS_BOTTOM + (GLASS_TOP - GLASS_BOTTOM) * fill;
    const top = new THREE.Vector3(0, GLASS_TOP + 0.5, 0);
    const bottom = new THREE.Vector3(0, surfaceY, 0);

    // The stream falls from above the rim; it stretches in, then retracts.
    const grow = THREE.MathUtils.smoothstep(t, 0, 0.28);
    const retract = 1 - THREE.MathUtils.smoothstep(t, 0.72, 1);
    const reach = grow * retract;

    const mid = top.clone().lerp(bottom, 0.5);
    const len = Math.max(top.distanceTo(bottom) * reach, 0.001);
    mesh.current.position.copy(mid);
    mesh.current.scale.set(1, len / 1, 1);
    mesh.current.position.y = top.y - len / 2;

    mat.current.opacity = 0.85 * reach;
    mat.current.color.copy(pour.color);
  });

  return (
    <mesh ref={mesh} geometry={geo}>
      <meshBasicMaterial
        ref={mat}
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Honey ribbon.
 *
 * A helix that falls through the drink and dissolves, so the densest pour is
 * visibly seen sinking rather than just appearing as a band at the bottom.
 */
export function HoneyRibbon({
  pour,
  fill,
}: {
  pour: ActivePour;
  fill: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  const geo = useMemo(() => {
    const surfaceY = GLASS_BOTTOM + (GLASS_TOP - GLASS_BOTTOM) * Math.max(fill, 0.25);
    const pts: THREE.Vector3[] = [];
    const turns = 2.6;
    const steps = 70;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = surfaceY - (surfaceY - GLASS_BOTTOM - 0.05) * t;
      const r = radiusAt(y) * (0.16 + 0.5 * Math.sin(t * Math.PI));
      const a = t * Math.PI * 2 * turns;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 90, 0.032, 7, false);
    // fill intentionally not a dep — the ribbon is created once per pour
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    if (!ref.current || !mat.current) return;
    const t = (state.clock.elapsedTime - pour.startedAt) / 1.9;
    if (t > 1) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    // Draw in from the top, then fade as it merges with the layer below.
    const draw = THREE.MathUtils.smoothstep(t, 0, 0.55);
    geo.setDrawRange(0, Math.floor(geo.index!.count * draw));
    mat.current.opacity = 0.9 * (1 - THREE.MathUtils.smoothstep(t, 0.6, 1));
    ref.current.rotation.y = t * 0.7;
  });

  return (
    <mesh ref={ref} geometry={geo}>
      <meshBasicMaterial
        ref={mat}
        color={pour.color}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Droplet burst when a pour hits the surface. */
export function Splash({ pour, fill }: { pour: ActivePour; fill: number }) {
  const ref = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const COUNT = 34;

  const { geo, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const vel: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.1;
      vel.push(
        new THREE.Vector3(
          Math.cos(a) * speed * 0.5,
          1.1 + Math.random() * 1.0,
          Math.sin(a) * speed * 0.5
        )
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo: g, velocities: vel };
  }, []);

  useFrame((state) => {
    if (!ref.current || !mat.current) return;
    const elapsed = state.clock.elapsedTime - pour.startedAt - 0.22;
    if (elapsed < 0 || elapsed > 1.1) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;

    const surfaceY = GLASS_BOTTOM + (GLASS_TOP - GLASS_BOTTOM) * fill;
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      const v = velocities[i];
      const x = v.x * elapsed;
      const y = v.y * elapsed - 4.2 * elapsed * elapsed;
      const z = v.z * elapsed;
      pos.setXYZ(i, x, surfaceY + y, z);
    }
    pos.needsUpdate = true;
    mat.current.opacity = 0.9 * (1 - elapsed / 1.1);
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        ref={mat}
        color={pour.color}
        size={0.055}
        transparent
        opacity={0}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/** The lime wheel: drops from above the rim and settles on the surface. */
export function LimeWheel({
  droppedAt,
  fill,
}: {
  droppedAt: number;
  fill: number;
}) {
  const ref = useRef<THREE.Group>(null);

  const geo = useMemo(() => new THREE.CylinderGeometry(0.3, 0.3, 0.035, 26), []);
  const segGeo = useMemo(
    () => new THREE.CylinderGeometry(0.245, 0.245, 0.04, 26, 1, false),
    []
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime - droppedAt;
    if (t < 0) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;

    const surfaceY = GLASS_BOTTOM + (GLASS_TOP - GLASS_BOTTOM) * fill;
    const restY = surfaceY - 0.04;
    const startY = GLASS_TOP + 0.6;

    if (t < 0.55) {
      // Fall with gravity
      const p = t / 0.55;
      ref.current.position.y = THREE.MathUtils.lerp(startY, restY, p * p);
      ref.current.rotation.z = 0.5 - p * 0.35;
      ref.current.rotation.x = 0.3 * (1 - p);
    } else {
      // Bob and settle
      const s = t - 0.55;
      const bob = Math.exp(-s * 2.2) * Math.sin(s * 9) * 0.05;
      ref.current.position.y = restY + bob;
      ref.current.rotation.z = THREE.MathUtils.damp(
        ref.current.rotation.z,
        0.14,
        2,
        0.016
      );
      ref.current.rotation.y += 0.004;
    }
  });

  return (
    <group ref={ref} position={[0.16, GLASS_TOP, 0.05]}>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color="#3f5c14"
          roughness={0.55}
          emissive="#243d06"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh geometry={segGeo}>
        <meshStandardMaterial
          color="#b6d84a"
          roughness={0.35}
          emissive="#5f7d15"
          emissiveIntensity={0.5}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
}

export { POUR_SECONDS };
