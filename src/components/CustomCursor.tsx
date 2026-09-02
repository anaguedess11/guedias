"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Seguidor de rato subtil. Só ativa em dispositivos de ponteiro fino e
 * quando o utilizador não pediu menos movimento. Ao passar por elementos
 * com [data-cursor="view"] cresce e mostra uma etiqueta ("Ver").
 * É puramente decorativo: pointer-events-none, nunca intercepta cliques.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    setEnabled(true);
    document.body.dataset.cursor = "on";

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = (e.target as HTMLElement | null)?.closest?.("[data-cursor]");
      setHovering(target ? target.getAttribute("data-cursor") : null);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      delete document.body.dataset.cursor;
    };
  }, [x, y]);

  if (!enabled) return null;

  const isView = hovering === "view";

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full"
      style={{ x: springX, y: springY }}
      animate={{
        width: isView ? 72 : 14,
        height: isView ? 72 : 14,
        marginLeft: isView ? -36 : -7,
        marginTop: isView ? -36 : -7,
        opacity: visible ? 1 : 0,
        backgroundColor: isView ? "rgb(199 67 15)" : "rgb(11 30 61)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <motion.span
        className="text-[11px] font-semibold uppercase tracking-wider text-white"
        animate={{ opacity: isView ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        Ver
      </motion.span>
    </motion.div>
  );
}
