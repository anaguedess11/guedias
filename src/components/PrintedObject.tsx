import { hexToRgba } from "@/lib/format";
import { ShapeProfile } from "@/lib/types";

/**
 * Representação visual "placeholder" de um produto: uma silhueta construída
 * por bandas horizontais, como camadas de impressão 3D (FDM), na cor
 * escolhida. Substitui fotografias reais nesta versão de demonstração.
 */
export function PrintedObject({
  profile,
  color,
  className = "",
  showLines = true,
}: {
  profile: ShapeProfile;
  color: string;
  className?: string;
  showLines?: boolean;
}) {
  const bands = profile.length;

  return (
    <div
      className={`relative flex items-end justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${hexToRgba(
          color,
          0.14
        )}, transparent 70%), linear-gradient(180deg, #FBFAF8 0%, #F2EEE7 100%)`,
      }}
    >
      <div
        className="flex flex-col items-center justify-end"
        style={{ width: "62%", height: "78%" }}
        aria-hidden
      >
        {profile.map((w, i) => {
          const t = bands === 1 ? 0 : i / (bands - 1);
          const alpha = 0.55 + t * 0.4;
          return (
            <div
              key={i}
              style={{
                width: `${Math.max(w, 0.12) * 100}%`,
                flex: "1 1 0%",
                backgroundColor: hexToRgba(color, alpha),
                marginBottom: showLines ? "2px" : 0,
                borderRadius: "3px",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
