"use client";

/* eslint-disable react-hooks/immutability --
   react-three-fiber's frame loop works by MUTATING three.js objects (positions,
   rotations, uniforms) inside useFrame — that is the library's designed escape
   hatch from React re-renders, not a hooks violation. */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * The bar top, in relief — and alive under the cursor.
 *
 * The photograph is mapped onto a finely subdivided plane and a blurred copy
 * of it drives displacement (never the sharp photo itself: per-vertex sampling
 * of razor luminance edges shreds the mesh into spikes). On top of that base
 * relief, a vertex-shader extension makes the surface react locally:
 *
 *   - a soft swell that follows the cursor across the tabletop,
 *   - expanding rings that radiate out from taps and fast sweeps,
 *   - a slow breathing motion so the scene never reads as a still image.
 *
 * The extension is injected into the stock MeshStandardMaterial via
 * onBeforeCompile, with the uniform objects created once and mutated by
 * reference each frame — an earlier custom ShaderMaterial in this project
 * never got its uniforms through to the compiled program, and this keeps all
 * of three's PBR lighting while avoiding that whole class of problem.
 */

type Props = {
  /** -1..1 pointer position, updated by the parent without re-rendering. */
  pointer: React.RefObject<{ x: number; y: number }>;
  lowPower: boolean;
  /** Rises 0..1 as the visitor engages; drives displacement and light. */
  liftRef: React.RefObject<number>;
  /** True while the pointer is over the stage. */
  hoverRef: React.RefObject<boolean>;
  /** Incremented on every pointer-down; each bump spawns a ripple. */
  pulseRef: React.RefObject<number>;
};

const RIPPLES = 8;

function Table({ pointer, lowPower, liftRef, hoverRef, pulseRef }: Props) {
  // One map: the photograph, used for colour and — after being downscaled and
  // blurred onto a canvas below — for displacement too. Displacing from the
  // full-resolution image turned its high-frequency detail into spikes;
  // downscaling low-passes it into the smooth mounds the glasses actually are.
  // A pre-baked depth file used to be loaded here as well; it was never read.
  const tex = useLoader(THREE.TextureLoader, "/images/bar-top.jpg");
  const mesh = useRef<THREE.Mesh>(null);
  const key = useRef<THREE.PointLight>(null);
  const { camera } = useThree();

  const geo = useMemo(() => {
    const seg = lowPower ? 128 : 320;
    return new THREE.PlaneGeometry(7.4, 7.4, seg, seg);
  }, [lowPower]);

  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
  }, [tex]);

  // Blurred low-res copy of the photo for displacement (see header comment).
  const dispTex = useMemo(() => {
    const img = tex.image as CanvasImageSource | undefined;
    if (!img || typeof document === "undefined") return null;
    const size = 128;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.filter = "blur(3px)";
    ctx.drawImage(img, 0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, [tex]);

  // Uniforms live outside React: created once, mutated by reference per frame.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCursor: { value: new THREE.Vector2(0.5, 0.5) },
      uCursorStrength: { value: 0 },
      // xy = ripple centre (uv), z = birth time, w = amplitude. z=-10 ⇒ spent.
      uRipples: {
        value: Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -10, 0)),
      },
    }),
    [],
  );

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: tex,
      displacementMap: dispTex ?? tex,
      displacementScale: 0.34,
      roughness: 0.62,
      metalness: 0.12,
      envMapIntensity: 0.6,
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform float uTime;
           uniform vec2 uCursor;
           uniform float uCursorStrength;
           uniform vec4 uRipples[${RIPPLES}];`,
        )
        .replace(
          "#include <displacementmap_vertex>",
          `#include <displacementmap_vertex>
           {
             vec2 tuv = vDisplacementMapUv;
             // Slow breathing so the relief never freezes into a poster.
             float breathe =
               sin(tuv.x * 6.2831 + uTime * 0.55) *
               sin(tuv.y * 6.2831 - uTime * 0.42) * 0.02;
             // Soft swell that follows the cursor across the tabletop.
             float dCur = distance(tuv, uCursor);
             float swell = uCursorStrength * exp(-dCur * dCur * 90.0);
             // Rings radiating from taps and fast sweeps.
             float rings = 0.0;
             for (int i = 0; i < ${RIPPLES}; i++) {
               vec4 r = uRipples[i];
               float age = uTime - r.z;
               if (age > 0.0 && age < 2.5) {
                 float d = distance(tuv, r.xy);
                 float front = age * 0.32;
                 rings += sin((d - front) * 52.0) * exp(-d * 6.0) *
                          exp(-age * 2.1) * r.w;
               }
             }
             transformed += normalize(objectNormal) * (breathe + swell + rings * 0.09);
           }`,
        );
    };
    return m;
  }, [tex, dispTex, uniforms]);

  // Scratch objects for the per-frame cursor raycast (no allocations in-loop).
  const scratch = useMemo(
    () => ({
      raycaster: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      plane: new THREE.Plane(),
      normal: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      lastUv: new THREE.Vector2(0.5, 0.5),
      lastRippleAt: 0,
      lastPulse: 0,
      rippleIdx: 0,
    }),
    [],
  );

  const spawnRipple = (uv: THREE.Vector2, t: number, amp: number) => {
    const slot = uniforms.uRipples.value[scratch.rippleIdx % RIPPLES];
    slot.set(uv.x, uv.y, t, amp);
    scratch.rippleIdx++;
  };

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const p = pointer.current ?? { x: 0, y: 0 };
    const lift = liftRef.current ?? 0;
    const hovering = hoverRef.current ?? false;

    uniforms.uTime.value = t;

    if (mesh.current) {
      // Tilt toward the cursor — the table is a surface you lean over.
      const targetX = -Math.PI / 2.55 + p.y * 0.18;
      const targetZ = p.x * 0.12;
      mesh.current.rotation.x = THREE.MathUtils.damp(mesh.current.rotation.x, targetX, 3, d);
      mesh.current.rotation.z = THREE.MathUtils.damp(mesh.current.rotation.z, targetZ, 3, d);

      // Where is the cursor ON the table? Intersect the pointer ray with the
      // table's plane (pure math — no geometry raycast against 200k triangles).
      scratch.ndc.set(p.x, p.y);
      scratch.raycaster.setFromCamera(scratch.ndc, camera);
      scratch.normal.set(0, 0, 1).applyQuaternion(mesh.current.quaternion);
      scratch.plane.setFromNormalAndCoplanarPoint(scratch.normal, mesh.current.position);
      if (scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.hit)) {
        mesh.current.worldToLocal(scratch.hit);
        const u = THREE.MathUtils.clamp(scratch.hit.x / 6 + 0.5, 0, 1);
        const v = THREE.MathUtils.clamp(scratch.hit.y / 6 + 0.5, 0, 1);

        // A fast sweep drags a wake of small ripples behind the cursor.
        const moved = scratch.lastUv.distanceTo(scratch.ndc.set(u, v));
        if (hovering && moved > 0.03 && t - scratch.lastRippleAt > 0.09) {
          spawnRipple(scratch.ndc, t, Math.min(0.5, moved * 6));
          scratch.lastRippleAt = t;
        }
        scratch.lastUv.set(u, v);

        // Glide the swell toward the cursor rather than snapping.
        uniforms.uCursor.value.x = THREE.MathUtils.damp(uniforms.uCursor.value.x, u, 8, d);
        uniforms.uCursor.value.y = THREE.MathUtils.damp(uniforms.uCursor.value.y, v, 8, d);
      }

      // Tap ⇒ a full ripple from under the finger.
      const pulse = pulseRef.current ?? 0;
      if (pulse !== scratch.lastPulse) {
        scratch.lastPulse = pulse;
        spawnRipple(scratch.lastUv, t, 1);
      }
    }

    uniforms.uCursorStrength.value = THREE.MathUtils.damp(
      uniforms.uCursorStrength.value,
      hovering ? 0.1 + lift * 0.2 : 0,
      5,
      d,
    );

    // Relief deepens as you engage with it.
    material.displacementScale = THREE.MathUtils.damp(
      material.displacementScale,
      0.34 + lift * 0.5,
      2.5,
      d,
    );

    if (key.current) {
      // A raking light that follows the cursor and glances off the glasses.
      // The lift surge is modest on purpose: doubling it washed the pale
      // tablecloth out to white once bloom picked it up.
      key.current.position.set(p.x * 4.6, 1.8 + lift * 1.2, p.y * 3.6 + 2.6);
      key.current.intensity = 24 + lift * 9;
    }

    // Slow orbital drift so it never feels frozen.
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      p.x * 0.95 + Math.sin(t * 0.15) * 0.12,
      2.4,
      d,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      4.6 - p.y * 0.55 - lift * 0.5,
      2.4,
      d,
    );
    camera.lookAt(-0.85, 0, 0);
  });

  return (
    <group>
      <mesh ref={mesh} geometry={geo} material={material} rotation={[-Math.PI / 2.55, 0, 0]} />

      <ambientLight intensity={0.55} />
      <pointLight ref={key} color="#ffd9a8" distance={16} decay={1.6} />
      {/* Brass fill from the far edge, so the back of the table never dies. */}
      <pointLight position={[-3, 2.4, -3.5]} intensity={12} color="#d9a862" distance={18} decay={1.8} />
      <pointLight position={[3.4, 1.2, -2.6]} intensity={7} color="#ff6a3d" distance={14} decay={2} />
    </group>
  );
}

export default function TableScene({
  pointer,
  lowPower,
  liftRef,
  hoverRef,
  pulseRef,
  active,
}: Props & { active: boolean }) {
  return (
    <Canvas
      dpr={lowPower ? [1, 1.4] : [1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 4.6, 6.9], fov: 36 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Table
          pointer={pointer}
          lowPower={lowPower}
          liftRef={liftRef}
          hoverRef={hoverRef}
          pulseRef={pulseRef}
        />
        {/* Glass highlights get a soft glow; the rest stays under threshold.
            Skipped on low-power devices — the base scene already carries. */}
        {!lowPower && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.45} luminanceThreshold={0.86} luminanceSmoothing={0.18} mipmapBlur />
            <Vignette offset={0.28} darkness={0.72} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
