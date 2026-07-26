"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * A coupe glass, built procedurally.
 *
 * No model file was supplied, so the silhouette is lathed from a 2D profile.
 * That is also cheaper than a GLB: a few hundred triangles, no fetch, and the
 * shape is tweakable by editing the profile arrays below.
 */

/** Outer wall of the glass, bottom of the base up to the rim. */
function buildGlassProfile() {
  const pts: THREE.Vector2[] = [];

  // Foot
  pts.push(new THREE.Vector2(0.0, 0.0));
  pts.push(new THREE.Vector2(0.62, 0.0));
  pts.push(new THREE.Vector2(0.64, 0.03));
  pts.push(new THREE.Vector2(0.6, 0.055));
  pts.push(new THREE.Vector2(0.2, 0.08));

  // Stem — a gentle waist rather than a straight column
  pts.push(new THREE.Vector2(0.075, 0.22));
  pts.push(new THREE.Vector2(0.062, 0.5));
  pts.push(new THREE.Vector2(0.07, 0.78));
  pts.push(new THREE.Vector2(0.1, 0.92));

  // Bowl — shallow and wide, the coupe flare
  const bowlStart = 0.95;
  const bowlTop = 1.62;
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = bowlStart + (bowlTop - bowlStart) * t;
    // Ease outward fast, then straighten toward the rim
    const r = 0.1 + Math.pow(t, 0.62) * 1.02;
    pts.push(new THREE.Vector2(r, y));
  }

  // Rim: fold back inward so the glass reads as having wall thickness
  pts.push(new THREE.Vector2(1.113, bowlTop + 0.012));
  pts.push(new THREE.Vector2(1.09, bowlTop + 0.014));
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = bowlStart + 0.045 + (bowlTop - bowlStart) * t;
    const r = 0.075 + Math.pow(t, 0.62) * 1.0;
    pts.push(new THREE.Vector2(Math.max(r, 0.02), y));
  }

  return pts;
}

/** Liquid surface sits just below the rim, following the bowl's inner wall. */
function buildLiquidProfile(fill = 0.72) {
  const pts: THREE.Vector2[] = [];
  const bowlStart = 0.97;
  const bowlTop = 1.62;
  const surfaceY = bowlStart + (bowlTop - bowlStart) * fill;
  const steps = 22;

  pts.push(new THREE.Vector2(0.0, bowlStart));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = bowlStart + (surfaceY - bowlStart) * t;
    const tt = (y - bowlStart) / (bowlTop - bowlStart);
    const r = 0.07 + Math.pow(Math.max(tt, 0), 0.62) * 0.99;
    pts.push(new THREE.Vector2(r, y));
  }
  // Flat top surface back to the axis
  pts.push(new THREE.Vector2(0.0, surfaceY));
  return pts;
}

type Props = {
  /** Cheap materials + fewer segments for low-power devices. */
  lowPower?: boolean;
  /** Drag velocity from the parent, used to tilt the liquid. */
  spinRef: React.RefObject<number>;
};

export default function CocktailGlass({ lowPower = false, spinRef }: Props) {
  // A transmissive material refracts whatever is behind it. The page is almost
  // black, so without this the glass renders as a black solid — this gives it
  // a warm interior to bend, which is what makes it read as glass.
  const refractBackground = useMemo(() => new THREE.Color("#4a3423"), []);
  const group = useRef<THREE.Group>(null);
  const liquid = useRef<THREE.Group>(null);
  const garnish = useRef<THREE.Group>(null);

  const segments = lowPower ? 48 : 96;

  const glassGeo = useMemo(() => {
    const g = new THREE.LatheGeometry(buildGlassProfile(), segments);
    g.computeVertexNormals();
    return g;
  }, [segments]);

  const liquidGeo = useMemo(() => {
    const g = new THREE.LatheGeometry(buildLiquidProfile(), segments);
    g.computeVertexNormals();
    return g;
  }, [segments]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (group.current) {
      // Idle drift so the object never feels frozen.
      group.current.position.y = Math.sin(t * 0.6) * 0.045;
      group.current.rotation.z = Math.sin(t * 0.45) * 0.02;
    }

    // Liquid lags the glass and tilts into the spin — reads as inertia.
    if (liquid.current) {
      const spin = spinRef.current ?? 0;
      const target = THREE.MathUtils.clamp(spin * 1.6, -0.26, 0.26);
      liquid.current.rotation.z = THREE.MathUtils.damp(
        liquid.current.rotation.z,
        target,
        4,
        delta
      );
      liquid.current.rotation.x = THREE.MathUtils.damp(
        liquid.current.rotation.x,
        Math.sin(t * 1.1) * 0.012,
        3,
        delta
      );
    }

    if (garnish.current) {
      garnish.current.rotation.y = t * 0.35;
      garnish.current.position.y = 1.66 + Math.sin(t * 1.4) * 0.012;
    }
  });

  return (
    <group ref={group} dispose={null}>
      {/* Liquid — rendered before the glass so refraction picks it up */}
      <group ref={liquid}>
        <mesh geometry={liquidGeo} castShadow>
          <meshPhysicalMaterial
            color="#e0431f"
            roughness={0.12}
            metalness={0}
            transmission={lowPower ? 0 : 0.5}
            thickness={1.1}
            ior={1.36}
            attenuationColor="#c22d10"
            attenuationDistance={1.6}
            transparent={!lowPower}
            opacity={1}
            emissive="#5e1607"
            emissiveIntensity={lowPower ? 0.35 : 0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* The glass itself */}
      <mesh geometry={glassGeo} castShadow>
        {lowPower ? (
          <meshPhysicalMaterial
            color="#fff6ea"
            roughness={0.06}
            metalness={0}
            transparent
            opacity={0.17}
            /* Without this the transparent shell sorts in front of the drink
               and hides it. */
            depthWrite={false}
            side={THREE.DoubleSide}
            envMapIntensity={3.2}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        ) : (
          <MeshTransmissionMaterial
            samples={6}
            resolution={512}
            transmission={1}
            roughness={0.03}
            thickness={0.32}
            ior={1.5}
            chromaticAberration={0.14}
            anisotropy={0.25}
            distortion={0.12}
            distortionScale={0.3}
            temporalDistortion={0.06}
            attenuationColor="#f6efe4"
            attenuationDistance={4}
            color="#ffffff"
            background={refractBackground}
          />
        )}
      </mesh>

      {/* Cherry on a pick, echoing the hero photograph */}
      <group ref={garnish} position={[0.34, 1.66, 0.1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.11, lowPower ? 14 : 28, lowPower ? 14 : 28]} />
          <meshStandardMaterial
            color="#4a0d0a"
            roughness={0.22}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, 0.34, 0]} rotation={[0, 0, 0.28]}>
          <cylinderGeometry args={[0.012, 0.012, 0.78, 8]} />
          <meshStandardMaterial color="#d9a862" roughness={0.45} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
