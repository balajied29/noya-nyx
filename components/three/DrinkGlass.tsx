"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

export const GLASS_BOTTOM = 0.18;
export const GLASS_TOP = 3.0;
export const MAX_LAYERS = 6;

export type Layer = { color: THREE.Color; height: number; density: number };

/** Outer wall, rim fold, then back down the inside — gives real thickness. */
function glassProfile() {
  const p: THREE.Vector2[] = [];
  p.push(new THREE.Vector2(0, 0));
  p.push(new THREE.Vector2(0.66, 0));
  p.push(new THREE.Vector2(0.685, 0.05));
  p.push(new THREE.Vector2(0.7, 0.35));
  p.push(new THREE.Vector2(0.735, 1.4));
  p.push(new THREE.Vector2(0.765, 2.3));
  p.push(new THREE.Vector2(0.785, 3.08));
  p.push(new THREE.Vector2(0.79, 3.11));
  p.push(new THREE.Vector2(0.755, 3.115));
  p.push(new THREE.Vector2(0.735, 2.3));
  p.push(new THREE.Vector2(0.705, 1.4));
  p.push(new THREE.Vector2(0.668, 0.35));
  p.push(new THREE.Vector2(0.63, 0.19));
  p.push(new THREE.Vector2(0, 0.17));
  return p;
}

export function radiusAt(y: number) {
  const t = THREE.MathUtils.clamp(
    (y - GLASS_BOTTOM) / (GLASS_TOP - GLASS_BOTTOM),
    0,
    1
  );
  return 0.625 + t * 0.105;
}

/** A closed slice of the drink between two heights. */
function bandGeometry(y0: number, y1: number, segments: number) {
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0, y0));
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const y = y0 + (y1 - y0) * (i / steps);
    pts.push(new THREE.Vector2(radiusAt(y) * 0.945, y));
  }
  pts.push(new THREE.Vector2(0, y1));
  const g = new THREE.LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

type Props = {
  layers: Layer[];
  fill: number;
  frost: number;
  settle: number;
  lowPower: boolean;
};

/**
 * The drink is built from one mesh per pour rather than a single shader.
 *
 * A custom ShaderMaterial was the first approach, but its uniforms never
 * reached the compiled program — the shader itself ran (a hard-coded colour
 * drew fine) while uCount and uFill stayed at their initial 0, so every
 * fragment hit a discard and the glass looked empty. Stacked meshes with
 * stock materials render reliably, and a clipping plane gives the same
 * rising-fill animation with no custom uniform plumbing.
 */
export default function DrinkGlass({
  layers,
  fill,
  frost,
  settle,
  lowPower,
}: Props) {
  const segments = lowPower ? 44 : 90;
  const { gl } = useThree();
  gl.localClippingEnabled = true;

  const glassGeo = useMemo(() => {
    const g = new THREE.LatheGeometry(glassProfile(), segments);
    g.computeVertexNormals();
    return g;
  }, [segments]);

  // Heaviest pour sits lowest; each band spans its share of the column.
  const bands = useMemo(() => {
    if (layers.length === 0) return [];
    const total = layers.reduce((s, l) => s + l.height, 0) || 1;
    const span = GLASS_TOP - GLASS_BOTTOM;
    let acc = 0;
    return layers.map((l) => {
      const y0 = GLASS_BOTTOM + span * acc;
      acc += l.height / total;
      const y1 = GLASS_BOTTOM + span * acc;
      // Overlap slightly so neighbouring colours bleed instead of hard-edging.
      return {
        geo: bandGeometry(
          Math.max(GLASS_BOTTOM, y0 - 0.06),
          y1 + 0.06,
          segments
        ),
        color: l.color,
      };
    });
  }, [layers, segments]);

  // The pour: a plane that rises through the stack.
  const clip = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), GLASS_BOTTOM),
    []
  );
  const shownFill = useRef(0);
  const glassMat = useRef<THREE.Material>(null);
  const refractBg = useMemo(() => new THREE.Color("#14100e"), []);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    shownFill.current = THREE.MathUtils.damp(shownFill.current, fill, 3.2, d);

    // Surface ripples while a pour is still settling.
    const ripple = Math.sin(state.clock.elapsedTime * 5.5) * 0.012 * settle;
    clip.constant =
      GLASS_BOTTOM + (GLASS_TOP - GLASS_BOTTOM) * shownFill.current + ripple;

    const mat = glassMat.current as unknown as {
      roughness?: number;
      transmission?: number;
    } | null;
    if (mat) {
      if (typeof mat.roughness === "number") {
        mat.roughness = THREE.MathUtils.damp(
          mat.roughness,
          0.03 + frost * 0.4,
          2.5,
          d
        );
      }
      if (typeof mat.transmission === "number") {
        mat.transmission = THREE.MathUtils.damp(
          mat.transmission,
          1 - frost * 0.22,
          2.5,
          d
        );
      }
    }
  });

  return (
    <group>
      <mesh geometry={glassGeo} renderOrder={1} castShadow>
        {lowPower ? (
          <meshPhysicalMaterial
            ref={glassMat as never}
            color="#fff6ea"
            roughness={0.06}
            metalness={0}
            transparent
            opacity={0.16}
            depthWrite={false}
            side={THREE.DoubleSide}
            envMapIntensity={3.2}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        ) : (
          <MeshTransmissionMaterial
            ref={glassMat as never}
            samples={5}
            resolution={384}
            transmission={1}
            roughness={0.03}
            thickness={0.14}
            ior={1.5}
            chromaticAberration={0.12}
            anisotropy={0.2}
            distortion={0.08}
            distortionScale={0.25}
            temporalDistortion={0.04}
            attenuationColor="#f6efe4"
            attenuationDistance={9}
            color="#ffffff"
            background={refractBg}
          />
        )}
      </mesh>

      {/* Drawn after the shell with depth testing off, so the transmissive
          glass in front never composites the drink away. */}
      {bands.map((b, i) => (
        <mesh key={i} geometry={b.geo} renderOrder={2 + i}>
          <meshPhysicalMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={0.16}
            roughness={0.14}
            metalness={0}
            transmission={0.35}
            thickness={0.9}
            ior={1.34}
            transparent
            opacity={0.8}
            depthWrite={false}
            depthTest={false}
            side={THREE.DoubleSide}
            clippingPlanes={[clip]}
          />
        </mesh>
      ))}
    </group>
  );
}
