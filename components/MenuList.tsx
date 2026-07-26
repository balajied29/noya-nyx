"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatPrice, type MenuCategory } from "@/content";

export default function MenuList({ menu }: { menu: MenuCategory[] }) {
  const [active, setActive] = useState(menu[0]?.id ?? "");
  const reduce = useReducedMotion();
  const current = menu.find((c) => c.id === active) ?? menu[0];

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Menu sections">
        {menu.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={cat.id === active}
            className={`tab ${cat.id === active ? "is-active" : ""}`}
            onClick={() => setActive(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={current?.id}
          className="list"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {current?.items.map((item) => (
            <li key={item.id} className="list__item">
              <div className="list__row">
                <span className="list__name">{item.name}</span>
                {typeof item.price === "number" && (
                  <span className="list__price">{formatPrice(item.price)}</span>
                )}
              </div>
              <span className="list__ingredients">
                {item.ingredients.join(" · ")}
              </span>
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </>
  );
}
