"use client";

import { useState } from "react";
import { PrintedObject } from "@/components/PrintedObject";
import { ShapeProfile } from "@/lib/types";

export function ProductGallery({
  images,
  name,
  profile,
  color,
}: {
  images: string[];
  name: string;
  profile: ShapeProfile;
  color: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <PrintedObject
        profile={profile}
        color={color}
        className="aspect-square w-full rounded-xl2 shadow-card"
      />
    );
  }

  return (
    <div>
      <div className="aspect-square w-full overflow-hidden rounded-xl2 bg-stone-50 shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex] ?? images[0]}
          alt={`${name}, foto ${activeIndex + 1} de ${images.length}`}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${images.length}`}
              aria-current={i === activeIndex}
              className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex ? "border-clay-500" : "border-transparent hover:border-clay-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
