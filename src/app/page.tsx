import Link from "next/link";
import Wordmark from "@/components/Wordmark";

const FEATURES = [
  {
    title: "No app to download",
    body: "Customers book from a link you share — on WhatsApp, Instagram, or anywhere else. No install, no account.",
  },
  {
    title: "Automatic waitlist",
    body: "When someone cancels, the freed slot is offered to the next person waiting — no calls, no missed revenue.",
  },
  {
    title: "Multi-staff scheduling",
    body: "Bookings are assigned to whichever staff member is free. Customers never have to guess who to pick.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="mx-auto w-full max-w-5xl px-6 py-8">
        <Wordmark />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-20 pt-8 text-center">
        <h1 className="font-display max-w-2xl text-balance text-4xl font-semibold leading-tight text-zinc-800 sm:text-5xl">
          Booking pages for local businesses
        </h1>
        <p className="mt-5 max-w-xl text-balance text-base text-zinc-600 sm:text-lg">
          A simple, professional booking page for salons, clinics, and gyms — with automatic waitlist
          promotion the moment someone cancels.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cedar-deep"
          >
            Create your booking page
          </Link>
          <Link
            href="/dashboard/login"
            className="rounded-full px-6 py-3 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
          >
            Log in to your dashboard
          </Link>
        </div>

        <div className="mt-20 grid w-full gap-6 text-left sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl bg-paper p-6 ring-1 ring-zinc-200">
              <h3 className="font-display text-base font-semibold text-zinc-800">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8 text-center text-xs text-zinc-400">
        Maw3ed — built for Lebanon&apos;s salons, clinics, and gyms.
      </footer>
    </div>
  );
}
