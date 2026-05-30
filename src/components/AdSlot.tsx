"use client";

import { useEffect, useRef, useState } from "react";

interface Ad {
  id: number;
  name: string;
  position: string;
  ad_code: string;
  width: number | null;
  height: number | null;
}

interface AdSlotProps {
  position: string;
  className?: string;
}

export default function AdSlot({ position, className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/ads?position=${encodeURIComponent(position)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ads?.length > 0) {
          setAd(data.ads[0]);
        }
      })
      .catch(() => {});
  }, [position]);

  useEffect(() => {
    if (!ad || !containerRef.current || loaded) return;
    setLoaded(true);

    const container = containerRef.current;
    container.innerHTML = ad.ad_code;

    const scripts = container.querySelectorAll("script");
    scripts.forEach((old) => {
      const s = document.createElement("script");
      s.src = old.getAttribute("src") || "";
      s.async = true;
      if (old.src) {
        old.replaceWith(s);
      } else if (old.textContent) {
        const inline = document.createElement("script");
        inline.textContent = old.textContent;
        old.replaceWith(inline);
      }
    });
  }, [ad, loaded]);

  if (!ad) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: ad.width || undefined,
        height: ad.height || undefined,
      }}
    />
  );
}
