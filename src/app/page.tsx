import Link from "next/link";
import Image from "next/image";
import Wordmark from "@/components/Wordmark";
import {
  IconAlert,
  IconBrowser,
  IconCalendarX,
  IconChat,
  IconClock,
  IconLink,
  IconRefresh,
  IconShieldCheck,
  IconUsers,
} from "@/components/icons";

const PAIN_POINTS = [
  {
    icon: IconChat,
    body: "A customer messages at midnight and you forget to reply by morning — booking lost.",
  },
  {
    icon: IconCalendarX,
    body: "Someone cancels last-minute and the slot just sits empty, because calling down the waitlist takes too long.",
  },
  {
    icon: IconAlert,
    body: "Two customers message at the same time for the same slot, and now you have an awkward call to make.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Tell us about your business",
    body: "Business name, services, and staff. Takes about two minutes — no technical setup on your end.",
  },
  {
    step: "02",
    title: "Get your own booking link",
    body: "A clean, branded link like yourbusiness.maw3edapp.com — share it on WhatsApp, Instagram, or your storefront window.",
  },
  {
    step: "03",
    title: "Bookings run themselves",
    body: "Customers pick a time, get auto-assigned to whoever's free, and can reschedule or cancel on their own — day or night.",
  },
];

const FEATURES = [
  {
    icon: IconBrowser,
    title: "No app to download",
    body: "Customers book from a link you share — on WhatsApp, Instagram, or anywhere else. No install, no account.",
  },
  {
    icon: IconClock,
    title: "Automatic waitlist",
    body: "When someone cancels, the freed slot is offered to the next person waiting — no calls, no missed revenue.",
  },
  {
    icon: IconUsers,
    title: "Multi-staff scheduling",
    body: "Bookings are assigned to whichever staff member is free. Customers never have to guess who to pick.",
  },
  {
    icon: IconRefresh,
    title: "Self-service changes",
    body: "Customers can reschedule or cancel their own appointment from a link — no back-and-forth messages needed.",
  },
  {
    icon: IconLink,
    title: "Your own branded link",
    body: "Every business gets a clean, professional web address — yours to put on business cards, stories, or a storefront sign.",
  },
  {
    icon: IconShieldCheck,
    title: "Race-condition-safe booking",
    body: "Built on a real database with proper safeguards, so two customers can never accidentally book the same slot.",
  },
];

const FAQS = [
  {
    q: "Do my customers need to download anything?",
    a: "No. They open your link in any browser, book, and get a confirmation — nothing to install, no account to create.",
  },
  {
    q: "What happens when a customer cancels?",
    a: "The freed slot is automatically offered to the next person on that day's waitlist — you don't have to call anyone.",
  },
  {
    q: "Can I have more than one staff member?",
    a: "Yes. Add as many staff as you like in Settings — bookings are automatically assigned to whoever is free.",
  },
  {
    q: "How much does it cost?",
    a: "Sign up below and we'll be in touch to set up a plan that fits your business.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8">
        <Wordmark />
        <Link href="/dashboard/login" className="text-sm font-medium text-zinc-600 hover:underline">
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden px-6 py-24 text-center sm:min-h-[640px]">
        <Image
          src="/images/hero-salon.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25" />
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="font-display max-w-2xl text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Booking pages for local businesses
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-zinc-100 sm:text-lg">
            A simple, professional booking page for salons, clinics, and gyms — with automatic waitlist
            promotion the moment someone cancels.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Create your booking page
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full px-6 py-3 text-sm font-medium text-white ring-1 ring-white/70 transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-24 pt-16 text-center">
        {/* Problem */}
        <section className="w-full text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Still booking over WhatsApp and a notebook?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PAIN_POINTS.map(({ icon: Icon, body }) => (
              <div key={body} className="rounded-xl bg-zinc-100 p-5">
                <Icon className="h-6 w-6 text-zinc-500" />
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mt-24 w-full scroll-mt-8 text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            How Maw3ed works
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step}>
                <span className="font-display text-3xl font-semibold text-zinc-300">{s.step}</span>
                <h3 className="font-display mt-2 text-base font-semibold text-zinc-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Photo section — full-bleed like the hero */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden px-6 py-20 text-center sm:min-h-[480px]">
        <Image
          src="/images/gym-interior.png"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Built for every kind of business
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-100 sm:text-base">
            Whether you run a salon, a clinic, or a gym, Maw3ed adapts to how your business actually
            takes bookings — multiple staff members, different service lengths, and a waitlist that
            fills itself the moment someone cancels.
          </p>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-24 pt-16 text-center">
        {/* Features */}
        <section className="mt-24 w-full text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Everything your booking page needs
          </h2>
          <div className="mt-8 grid w-full gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl bg-paper p-6 ring-1 ring-zinc-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <Icon className="h-5 w-5 text-zinc-900" />
                </div>
                <h3 className="font-display mt-3 text-base font-semibold text-zinc-800">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-24 w-full max-w-2xl text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Questions business owners ask
          </h2>
          <div className="mt-8 flex flex-col gap-6">
            {FAQS.map((f) => (
              <div key={f.q} className="border-b border-zinc-200 pb-6 last:border-0">
                <h3 className="text-sm font-semibold text-zinc-800">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Closing CTA — full-bleed like the hero */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden px-6 py-20 text-center sm:min-h-[480px]">
        <Image
          src="/images/dental-clinic.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Ready to stop losing bookings to a missed message?
          </h2>
          <p className="mt-3 text-sm text-zinc-200 sm:text-base">
            Set up your booking page today — it takes about two minutes.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            Create your booking page
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8 pt-16 text-center text-xs text-zinc-400">
        Maw3ed — built for Lebanon&apos;s salons, clinics, and gyms.
      </footer>
    </div>
  );
}
