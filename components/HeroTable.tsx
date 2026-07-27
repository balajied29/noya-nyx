"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const TableScene = dynamic(() => import("./three/TableScene"), {
  ssr: false,
  loading: () => null,
});

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Hero.
 *
 * Pointer and "lift" live in refs, not state — they change every frame and
 * pushing them through React would re-render the tree continuously. The canvas
 * reads the refs inside its own loop instead.
 */
export default function HeroTable() {
  const [caps, setCaps] = useState<{ webgl: boolean; lowPower: boolean } | null>(
    null
  );
  const [active, setActive] = useState(true);
  const pointer = useRef({ x: 0, y: 0 });
  const lift = useRef(0);
  const hover = useRef(false);
  const pulse = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Capability detection has to run in an effect: it reads window/navigator,
    // which don't exist during the SSR pass, and it runs exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!hasWebGL()) return setCaps({ webgl: false, lowPower: false });
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true;
    if (saveData) return setCaps({ webgl: false, lowPower: false });

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 861;
    const cores = navigator.hardwareConcurrency ?? 4;
    setCaps({ webgl: true, lowPower: coarse || narrow || cores <= 4 });
  }, []);

  // Stop rendering once the hero has scrolled away.
  useEffect(() => {
    const el = shellRef.current;
    if (!el || !caps?.webgl) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [caps?.webgl]);

  const onMove = useCallback((e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    hover.current = true;
    pointer.current = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: -(((e.clientY - r.top) / r.height) * 2 - 1),
    };
  }, []);

  // Press-and-hold deepens the relief and brightens the rake.
  const raf = useRef(0);
  const raise = useCallback(() => {
    const step = () => {
      lift.current = Math.min(1, lift.current + 0.08);
      if (lift.current < 1) raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
  }, []);
  const lower = useCallback(() => {
    const step = () => {
      lift.current = Math.max(0, lift.current - 0.06);
      if (lift.current > 0) raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
  }, []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <section className="table-hero" id="top" ref={shellRef}>
      <div
        className="table-hero__stage"
        onPointerMove={onMove}
        onPointerDown={() => {
          pulse.current++; // each tap radiates a ripple from under the finger
          raise();
        }}
        onPointerUp={lower}
        onPointerLeave={() => {
          pointer.current = { x: 0, y: 0 };
          hover.current = false;
          lower();
        }}
      >
        {caps?.webgl ? (
          <TableScene
            pointer={pointer}
            lowPower={caps.lowPower}
            liftRef={lift}
            hoverRef={hover}
            pulseRef={pulse}
            active={active}
          />
        ) : (
          // No WebGL, or data saver on: the photograph carries it alone.
          <Image
            src="/images/bar-top.jpg"
            alt="Cocktails across the Noya bar top"
            fill
            priority
            sizes="100vw"
            className="table-hero__flat"
          />
        )}
      </div>

      <div className="table-hero__copy">
        <p className="eyebrow">Guwahati · Est. 2026</p>
        <h1 className="display display--xl">
          Not every door is
          <span className="accent-italic">marked.</span>
        </h1>
        <p className="body-copy">
          A cocktail room above the city, built for long conversations and
          short pours of something you have never had before.
        </p>
        {caps?.webgl && (
          <p className="table-hero__hint micro">Move to light · hold to lift</p>
        )}
      </div>

      <a className="table-hero__scroll micro" href="#list">
        The list
      </a>
    </section>
  );
}
