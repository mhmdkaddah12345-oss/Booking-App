import Link from "next/link";
import Image from "next/image";
import Wordmark from "@/components/Wordmark";
import InstallAppButton from "@/components/InstallAppButton";
import StandaloneLoginRedirect from "@/components/StandaloneLoginRedirect";
import Reveal from "@/components/Reveal";
import FaqAccordion from "@/components/FaqAccordion";
import BookingPreviewMockup from "@/components/BookingPreviewMockup";
import { PLANS, PlanId } from "@/lib/plans";
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

const BUSINESS_TYPES = ["Salons", "Barbershops", "Clinics", "Gyms", "Spas", "Nail studios"];

// Cycles feature-card icon tints through the brand's three accent notes
// (terracotta, gold, cedar — the same trio in cardAccentBarClass) so the
// grid reads as lively rather than six identical grey circles.
const ICON_TINTS = [
  "bg-[#b5654f]/10 text-[#b5654f]",
  "bg-[#b98b3e]/15 text-[#8a692f]",
  "bg-cedar/10 text-cedar",
];

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
    a: "$30/month, or save by paying for 6 months ($150) or a full year ($240). Every business starts with a free trial — see Pricing above for the full breakdown.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <StandaloneLoginRedirect />
      <header className="sticky top-0 z-30 border-b border-zinc-200/0 bg-zinc-50/80 backdrop-blur-md transition-colors">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <Wordmark />
          <div className="flex items-center gap-4">
            <InstallAppButton />
            <Link href="/dashboard/login" className="text-sm font-medium text-zinc-600 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden px-6 py-24 text-center sm:min-h-[680px]">
        <Image
          src="/images/hero-salon.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25" />
        {/* Soft drifting color glows in the brand's terracotta/cedar tones,
            layered above the photo darkening but below the copy — reads as
            depth rather than a flat overlay. */}
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#b5654f]/40 blur-[90px]"
        />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cedar/30 blur-[100px]"
          style={{ animationDelay: "-9s" }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-zinc-100 ring-1 ring-white/30 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8a86f]" />
            Built for Lebanon&apos;s salons, clinics &amp; gyms
          </span>

          <h1 className="font-display mt-6 max-w-2xl text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Booking pages for local businesses
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-zinc-100 sm:text-lg">
            A simple, professional booking page for salons, clinics, and gyms — with automatic waitlist
            promotion the moment someone cancels.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-150 hover:scale-[1.03] hover:bg-zinc-100 active:scale-[0.97]"
            >
              Create your booking page
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full px-6 py-3 text-sm font-medium text-white ring-1 ring-white/70 transition-all duration-150 hover:scale-[1.03] hover:bg-white/10 active:scale-[0.97]"
            >
              See how it works
            </Link>
          </div>

          {/* Business-type strip — a quiet, continuous reminder of who this
              is for, without claiming customer counts we don't have. */}
          <div className="mt-10 w-full max-w-xs overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] sm:max-w-md">
            <div className="animate-marquee flex w-max gap-8 text-xs font-medium uppercase tracking-wide text-zinc-200/80">
              {[...BUSINESS_TYPES, ...BUSINESS_TYPES].map((type, i) => (
                <span key={i} className="whitespace-nowrap">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-24 pt-16 text-center">
        {/* Problem */}
        <Reveal className="w-full text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Still booking over WhatsApp and a notebook?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PAIN_POINTS.map(({ icon: Icon, body }) => (
              <div
                key={body}
                className="group rounded-xl bg-zinc-100 p-5 transition-all duration-200 hover:-translate-y-1 hover:bg-zinc-200/70 hover:shadow-sm"
              >
                <Icon className="h-6 w-6 text-zinc-500 transition-transform duration-200 group-hover:scale-110" />
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* How it works */}
        <Reveal id="how-it-works" className="mt-24 w-full scroll-mt-8 text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            How Maw3ed works
          </h2>
          <div className="relative mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-zinc-200 sm:block" />
            {STEPS.map((s) => (
              <div key={s.step} className="relative">
                <span className="font-display relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-semibold text-white shadow-sm">
                  {s.step}
                </span>
                <h3 className="font-display mt-4 text-base font-semibold text-zinc-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Photo split */}
        <Reveal className="mt-24 grid w-full items-center gap-8 text-left sm:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-800 sm:text-3xl">
              Built for every kind of business
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Whether you run a salon, a clinic, or a gym, Maw3ed adapts to how your business actually
              takes bookings — multiple staff members, different service lengths, and a waitlist that
              fills itself the moment someone cancels.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/images/gym-interior.png"
              alt="Modern gym interior with exercise equipment"
              fill
              className="object-cover"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </div>
        </Reveal>

        {/* Product preview */}
        <Reveal className="mt-24 grid w-full items-center gap-10 text-left sm:grid-cols-2">
          <div className="order-2 sm:order-1">
            <BookingPreviewMockup />
          </div>
          <div className="order-1 sm:order-2">
            <h2 className="font-display text-2xl font-semibold text-zinc-800 sm:text-3xl">
              What your customers actually see
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
              A clean page with your services, open time slots, and instant confirmation — the moment
              someone books, it&apos;s locked into your calendar. No app, no account, no confusion about
              which times are actually free.
            </p>
          </div>
        </Reveal>

        {/* Features */}
        <Reveal className="mt-24 w-full text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Everything your booking page needs
          </h2>
          <div className="mt-8 grid w-full gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="group rounded-xl bg-paper p-6 shadow-sm ring-1 ring-zinc-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${ICON_TINTS[i % ICON_TINTS.length]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-3 text-base font-semibold text-zinc-800">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Pricing */}
        <Reveal id="pricing" className="mt-24 w-full scroll-mt-8">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Simple, honest pricing
          </h2>
          <p className="mt-3 text-center text-sm text-zinc-500">
            Every business starts with a free trial. Pay by bank transfer, Whish Money, or OMT — LBP
            equivalent to market rate at time of payment.
          </p>
          <div className="mt-8 grid w-full gap-6 text-left sm:grid-cols-3">
            {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([planId, plan]) => {
              const isHighlighted = planId === "yearly";
              return (
                <div
                  key={planId}
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 ${
                    isHighlighted
                      ? "bg-zinc-900 text-white shadow-lg"
                      : "bg-paper shadow-sm ring-1 ring-zinc-200 hover:shadow-md"
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#e8a86f] px-2.5 py-0.5 text-xs font-medium text-zinc-900">
                      Best value
                    </span>
                  )}
                  <p className={`font-display text-sm font-semibold ${isHighlighted ? "text-zinc-200" : "text-zinc-500"}`}>
                    {plan.label}
                  </p>
                  <p className="mt-2 flex items-baseline gap-2">
                    {plan.compareAtUsd && (
                      <span className={`text-lg line-through ${isHighlighted ? "text-zinc-400" : "text-zinc-300"}`}>
                        ${plan.compareAtUsd}
                      </span>
                    )}
                    <span className="font-display text-3xl font-semibold">${plan.priceUsd}</span>
                    <span className={`text-sm ${isHighlighted ? "text-zinc-300" : "text-zinc-500"}`}>
                      / {plan.days === 30 ? "month" : plan.days === 182 ? "6 months" : "year"}
                    </span>
                  </p>
                  <p className={`mt-1 text-sm ${isHighlighted ? "text-zinc-300" : "text-zinc-500"}`}>
                    ${plan.perMonthUsd}/mo{plan.discountLabel ? ` — ${plan.discountLabel}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* FAQ */}
        <Reveal className="mt-24 w-full max-w-2xl text-left">
          <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Questions business owners ask
          </h2>
          <FaqAccordion faqs={FAQS} />
        </Reveal>

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
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#b98b3e]/25 blur-[100px]"
        />
        <div className="relative z-10">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Ready to stop losing bookings to a missed message?
          </h2>
          <p className="mt-3 text-sm text-zinc-200 sm:text-base">
            Set up your booking page today — it takes about two minutes.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-150 hover:scale-[1.03] hover:bg-zinc-100 active:scale-[0.97]"
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
