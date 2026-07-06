"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Product image with a circular "power-glass" magnifier that follows the cursor
 * on hover, showing a zoomed-in slice of the same image. Pointer-driven only, so
 * it stays invisible on touch devices.
 */
export function MagnifierImage({
  src,
  alt,
  zoom = 2.4,
  lensSize = 180,
}: {
  src: string;
  alt: string;
  zoom?: number;
  lensSize?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  // x,y = cursor within the image; w,h = image box; bx,by = background offset in
  // px so the exact point under the cursor lands at the lens centre.
  const [lens, setLens] = useState({ x: 0, y: 0, w: 0, h: 0, bx: 0, by: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLens({
      x,
      y,
      w: rect.width,
      h: rect.height,
      bx: -(x * zoom - lensSize / 2),
      by: -(y * zoom - lensSize / 2),
    });
  };

  return (
    <div
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onMouseMove={onMove}
      className="relative size-full cursor-zoom-in"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width:1024px) 100vw, 460px"
        className="object-cover"
        priority
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10 rounded-full shadow-xl ring-1 ring-black/10 transition-opacity duration-150",
          show ? "opacity-100" : "opacity-0",
        )}
        style={{
          height: lensSize,
          width: lensSize,
          left: lens.x - lensSize / 2,
          top: lens.y - lensSize / 2,
          backgroundImage: `url("${src}")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${lens.w * zoom}px ${lens.h * zoom}px`,
          backgroundPosition: `${lens.bx}px ${lens.by}px`,
          backgroundColor: "hsl(var(--muted))",
        }}
      />
    </div>
  );
}
