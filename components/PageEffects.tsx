"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const DESKTOP = "(min-width: 861px) and (prefers-reduced-motion: no-preference)";
const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export default function PageEffects() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      let alive = true;
      const splits: SplitText[] = [];

      document.fonts.ready.then(() => {
        if (!alive) return;

        // Masked line reveal on the hero headline.
        document
          .querySelectorAll<HTMLElement>(".hero__title")
          .forEach((el) => {
            const split = SplitText.create(el, { type: "lines", mask: "lines" });
            splits.push(split);
            gsap.from(split.lines, {
              yPercent: 118,
              duration: 1.2,
              ease: "power4.out",
              stagger: 0.1,
              delay: 0.25,
            });
          });

        gsap.from(".hero__content .eyebrow, .hero__content .body-copy", {
          opacity: 0,
          y: 20,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.65,
        });
      });

      // Section content lifts in as it enters.
      gsap.utils
        .toArray<HTMLElement>("[data-reveal]")
        .forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 32,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

      return () => {
        alive = false;
        splits.forEach((s) => s.revert());
      };
    });

    mm.add(DESKTOP, () => {
      gsap.from(".hero__media img", {
        scale: 1.14,
        duration: 1.9,
        ease: "power2.out",
      });

      gsap.to(".hero__media img", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      document
        .querySelectorAll<HTMLElement>(".room__figure")
        .forEach((wrap) => {
          const img = wrap.querySelector("img");
          if (!img) return;
          gsap.fromTo(
            img,
            { yPercent: -7, scale: 1.12 },
            {
              yPercent: 7,
              scale: 1.12,
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });

      gsap.from(".footer__wordmark span", {
        yPercent: 106,
        duration: 1.3,
        ease: "power3.out",
        scrollTrigger: { trigger: ".footer__wordmark", start: "top 95%" },
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}
