"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades + slides a section up as it scrolls into view. Pure CSS transition
 * driven by one class toggle, so it costs nothing until IntersectionObserver
 * fires — no animation library needed for a single reveal-on-scroll effect.
 */
export default function Reveal({
  children,
  className = "",
  delayMs = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      id={id}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
