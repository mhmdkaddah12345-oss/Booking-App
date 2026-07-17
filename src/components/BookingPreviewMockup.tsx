// A static recreation of the real booking page's slot picker — not a
// screenshot, the actual component visual language (see src/app/b/[slug])
// — so the landing page shows customers exactly what they'll get instead of
// a generic stock mockup.
const SLOTS = [
  { time: "09:00", state: "taken" },
  { time: "09:30", state: "open" },
  { time: "10:00", state: "open" },
  { time: "10:30", state: "selected" },
  { time: "11:00", state: "open" },
  { time: "11:30", state: "taken" },
  { time: "13:00", state: "open" },
  { time: "13:30", state: "open" },
] as const;

export default function BookingPreviewMockup() {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-paper shadow-xl ring-1 ring-zinc-200">
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        <span className="ml-2 truncate rounded-full bg-white px-3 py-1 text-[11px] text-zinc-400 ring-1 ring-zinc-200">
          bellasalon.maw3edapp.com
        </span>
      </div>
      <div className="p-5 text-left">
        <p className="text-sm font-semibold text-zinc-800">Bella Salon</p>
        <p className="mt-3 text-xs font-medium text-zinc-500">Services</p>
        <div className="mt-1 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-200">
          Haircut + Blow Dry — 45 min
          <span className="text-zinc-400">▾</span>
        </div>

        <p className="mt-4 text-xs font-medium text-zinc-500">Today</p>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {SLOTS.map((s) => (
            <span
              key={s.time}
              className={`rounded-md px-1.5 py-1.5 text-center text-[11px] font-medium ${
                s.state === "selected"
                  ? "bg-zinc-900 text-white"
                  : s.state === "taken"
                  ? "bg-zinc-100 text-zinc-300 line-through"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200"
              }`}
            >
              {s.time}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-cedar/10 px-3 py-2 text-[11px] font-medium text-cedar-deep">
          Confirmed for 10:30 — see you soon!
        </div>
      </div>
    </div>
  );
}
