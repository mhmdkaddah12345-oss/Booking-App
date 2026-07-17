"use client";

import { useState } from "react";

export default function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-8 flex flex-col gap-2">
      {faqs.map((f, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={f.q}
            className={`overflow-hidden rounded-xl transition-colors duration-200 ${
              isOpen ? "bg-white shadow-sm ring-1 ring-zinc-200" : "bg-zinc-100/60"
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-zinc-800">{f.q}</span>
              <span
                className={`shrink-0 text-lg text-zinc-400 transition-transform duration-200 ${
                  isOpen ? "rotate-45 text-zinc-900" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-600">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
