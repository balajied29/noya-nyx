"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#room", label: "The room" },
  { href: "#list", label: "The list" },
  { href: "#private", label: "Private" },
];

export default function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`header ${solid ? "header--solid" : ""}`}>
      <a href="#top" className="header__brand">
        Noya
      </a>
      <div className="header__right">
        <nav className="header__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#private" className="pill">
          Enquire
        </a>
      </div>
    </header>
  );
}
