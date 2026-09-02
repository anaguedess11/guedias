"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * template.tsx é re-montado a cada navegação — usamo-lo para uma
 * transição de entrada suave entre páginas. Só animamos opacidade
 * (nada de transform) para não interferir com elementos position:
 * sticky (Header, secção de scroll da home).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
