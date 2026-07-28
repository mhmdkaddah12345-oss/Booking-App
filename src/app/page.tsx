"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Wordmark from "@/components/Wordmark";
import InstallAppButton from "@/components/InstallAppButton";
import StandaloneLoginRedirect from "@/components/StandaloneLoginRedirect";
import Reveal from "@/components/Reveal";
import FaqAccordion from "@/components/FaqAccordion";
import BookingPreviewMockup from "@/components/BookingPreviewMockup";
import { PLANS, PlanId } from "@/lib/plans";
import { landingCopy, Lang } from "@/lib/landingTranslations";
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

// Cycles feature-card icon tints through the brand's three accent notes
// (terracotta, gold, cedar — the same trio in cardAccentBarClass) so the
// grid reads as lively rather than six identical grey circles. The dark
// variants run brighter/more saturated so they hold contrast on the
// espresso-dark Features band instead of washing out.
const ICON_TINTS = [
  "bg-white/10 text-[#e8a86f]",
  "bg-white/10 text-[#e0c08a]",
  "bg-white/10 text-[#9cc2a8]",
];

const PAIN_ICONS = [IconChat, IconCalendarX, IconAlert];
const FEATURE_ICONS = [IconBrowser, IconClock, IconUsers, IconRefresh, IconLink, IconShieldCheck];

// Underline grows from the center on hover instead of just a color swap —
// a small flourish that matches the terracotta accent used for the pricing
// "best value" badge and the hero's glow blobs, so the header doesn't read
// as plain unstyled text links.
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group relative py-1 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
      {children}
      <span className="absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-[#b5654f] transition-transform duration-200 ease-out group-hover:scale-x-100" />
    </Link>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = landingCopy[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className={`flex min-h-screen flex-col bg-paper ${lang === "ar" ? "lang-ar" : ""}`}>
      <StandaloneLoginRedirect />
      <header className="sticky top-0 z-30 border-b border-zinc-200/0 bg-zinc-50/80 backdrop-blur-md transition-colors">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <Wordmark />
          <nav className="hidden items-center gap-7 md:flex">
            <NavLink href="#how-it-works">{t.nav.howItWorks}</NavLink>
            <NavLink href="#features">{t.nav.features}</NavLink>
            <NavLink href="#pricing">{t.nav.pricing}</NavLink>
            <NavLink href="#faq">{t.nav.faq}</NavLink>
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition-colors hover:bg-zinc-100"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
            <InstallAppButton />
            <Link href="/dashboard/login" className="text-sm font-medium text-zinc-600 hover:underline">
              {t.logIn}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — clip-path gives the bottom edge a torn-paper diagonal
          instead of a flat rectangle, so the transition into the next band
          reads as a deliberate cut rather than a stacked box. */}
      <section
        className="relative flex min-h-[620px] items-center justify-center overflow-hidden px-6 pb-28 pt-24 text-center sm:min-h-[720px]"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 94%, 0 100%)" }}
      >
        <Image src="/images/hero-salon.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#b5654f]/40 blur-[90px]"
        />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cedar/30 blur-[100px]"
          style={{ animationDelay: "-9s" }}
        />
        <div key={lang} className="animate-hero-in relative z-10 flex flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-zinc-100 ring-1 ring-white/30 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8a86f]" />
            {t.hero.badge}
          </span>

          <h1 className="font-display mt-6 max-w-2xl text-balance text-5xl font-semibold leading-[1.15] text-white sm:text-6xl">
            {t.hero.headline}
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-zinc-100 sm:text-lg">{t.hero.subhead}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-150 hover:scale-[1.03] hover:bg-zinc-100 active:scale-[0.97]"
            >
              {t.hero.ctaPrimary}
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-full px-6 py-3 text-sm font-medium text-white ring-1 ring-white/70 transition-all duration-150 hover:scale-[1.03] hover:bg-white/10 active:scale-[0.97]"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>

          {/* Business-type strip — a quiet, continuous reminder of who this
              is for, without claiming customer counts we don't have. */}
          <div className="mt-10 w-full max-w-xs overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] sm:max-w-md">
            <div
              className={`animate-marquee flex w-max gap-8 text-xs font-medium text-zinc-200/80 ${
                lang === "en" ? "uppercase tracking-wide" : ""
              }`}
            >
              {[...t.hero.businessTypes, ...t.hero.businessTypes].map((type, i) => (
                <span key={i} className="whitespace-nowrap">
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem — pulled up to tuck under the hero's diagonal cut */}
      <section className="-mt-16 bg-paper pt-4 sm:-mt-20">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <Reveal className="w-full text-start">
            <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
              {t.problem.heading}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {t.problem.points.map((body, i) => {
                const Icon = PAIN_ICONS[i];
                return (
                  <div
                    key={body}
                    className="group rounded-xl bg-zinc-100 p-5 transition-all duration-200 hover:-translate-y-1 hover:bg-zinc-200/70 hover:shadow-sm"
                  >
                    <Icon className="h-6 w-6 text-zinc-500 transition-transform duration-200 group-hover:scale-110" />
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600">{body}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works — warm tint band breaks the "everything on bg-paper"
          monotony and gives the page a sense of moving through chapters. */}
      <section className="bg-zinc-100">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal id="how-it-works" className="w-full scroll-mt-28 text-start">
            <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
              {t.howItWorks.heading}
            </h2>
            <div className="relative mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
              <div aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-zinc-300 sm:block" />
              {t.howItWorks.steps.map((s, i) => (
                <div key={s.title} className="relative">
                  <span className="font-display relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-semibold text-white shadow-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display mt-4 text-base font-semibold text-zinc-800">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Photo split + product preview — the photo bleeds past the
          container edge on desktop instead of sitting in a boxed rounded
          card like every other panel, breaking the page's rectangle rhythm. */}
      <section className="overflow-hidden bg-paper">
        <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-20">
          <Reveal className="grid w-full items-center gap-8 text-start sm:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-zinc-800 sm:text-3xl">
                {t.photoSplit.heading}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">{t.photoSplit.body}</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:-me-6 sm:aspect-[5/4] sm:rounded-s-2xl sm:rounded-e-none lg:-me-[calc((100vw-64rem)/2+1.5rem)]">
              <Image
                src="/images/gym-interior.png"
                alt="Modern gym interior with exercise equipment"
                fill
                className="object-cover"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            </div>
          </Reveal>

          <Reveal className="grid w-full items-center gap-10 text-start sm:grid-cols-2">
            <div className="order-2 sm:order-1">
              <BookingPreviewMockup lang={lang} />
            </div>
            <div className="order-1 sm:order-2">
              <h2 className="font-display text-2xl font-semibold text-zinc-800 sm:text-3xl">{t.preview.heading}</h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">{t.preview.body}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features — the page's one dark moment. Everything else on this
          page is light/warm, so a genuine contrast band here (not another
          grey-on-white grid) is what actually breaks the template feel. */}
      <section className="bg-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal id="features" className="w-full scroll-mt-28 text-start">
            <h2 className="font-display text-center text-2xl font-semibold text-white sm:text-3xl">
              {t.features.heading}
            </h2>
            <div className="mt-8 grid w-full gap-6 sm:grid-cols-3">
              {t.features.items.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <div
                    key={f.title}
                    className="group rounded-xl bg-white/5 p-6 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.07]"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110 ${ICON_TINTS[i % ICON_TINTS.length]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display mt-3 text-base font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pricing — a warm "spotlight" band since this is the moment that
          actually matters most to a hesitant owner. */}
      <section className="relative overflow-hidden bg-zinc-100">
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#b5654f]/20 blur-[100px]"
        />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-cedar/20 blur-[100px]"
          style={{ animationDelay: "-9s" }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-20">
          <Reveal id="pricing" className="w-full scroll-mt-28">
            <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
              {t.pricing.heading}
            </h2>
            <p className="mt-3 text-center text-sm text-zinc-500">{t.pricing.subtext}</p>
            <div className="mt-8 grid w-full gap-6 text-start sm:grid-cols-3">
              {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([planId, plan]) => {
                const isHighlighted = planId === "yearly";
                const period =
                  plan.days === 30 ? t.pricing.periodMonth : plan.days === 182 ? t.pricing.periodHalfYear : t.pricing.periodYear;
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
                      <span className="absolute end-4 top-4 rounded-full bg-[#e8a86f] px-2.5 py-0.5 text-xs font-medium text-zinc-900">
                        {t.pricing.bestValue}
                      </span>
                    )}
                    <p className={`font-display text-sm font-semibold ${isHighlighted ? "text-zinc-200" : "text-zinc-500"}`}>
                      {t.pricing.planNames[planId]}
                    </p>
                    <p className="mt-2 flex items-baseline gap-2">
                      {plan.compareAtUsd && (
                        <span className={`text-lg line-through ${isHighlighted ? "text-zinc-400" : "text-zinc-300"}`}>
                          ${plan.compareAtUsd}
                        </span>
                      )}
                      <span className="font-display text-3xl font-semibold">${plan.priceUsd}</span>
                      <span className={`text-sm ${isHighlighted ? "text-zinc-300" : "text-zinc-500"}`}>/ {period}</span>
                    </p>
                    <p className={`mt-1 text-sm ${isHighlighted ? "text-zinc-300" : "text-zinc-500"}`}>
                      ${plan.perMonthUsd}/{t.pricing.perMonth}
                      {plan.discountLabel ? ` — ${lang === "ar" ? `وفّر ${plan.discountLabel.replace(/\D/g, "")}٪` : plan.discountLabel}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <Reveal id="faq" className="w-full scroll-mt-28 text-start">
            <h2 className="font-display text-center text-2xl font-semibold text-zinc-800 sm:text-3xl">
              {t.faq.heading}
            </h2>
            <FaqAccordion faqs={t.faq.items} />
          </Reveal>
        </div>
      </section>

      {/* Closing CTA — full-bleed like the hero, with a matching diagonal
          top edge so the two dark photo moments bookend the page. */}
      <section
        className="relative -mt-16 flex min-h-[440px] items-center justify-center overflow-hidden px-6 pb-20 pt-28 text-center sm:-mt-20 sm:min-h-[500px]"
        style={{ clipPath: "polygon(0 6%, 100% 0, 100% 100%, 0 100%)" }}
      >
        <Image src="/images/dental-clinic.jpg" alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-black/70" />
        <div
          aria-hidden
          className="animate-drift pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#b98b3e]/25 blur-[100px]"
        />
        <div className="relative z-10">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t.closingCta.heading}</h2>
          <p className="mt-3 text-sm text-zinc-200 sm:text-base">{t.closingCta.body}</p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-150 hover:scale-[1.03] hover:bg-zinc-100 active:scale-[0.97]"
          >
            {t.closingCta.cta}
          </Link>
        </div>
      </section>

      <footer className="-mt-1 bg-paper px-6 pb-8 pt-10 text-center text-xs text-zinc-400">{t.footer}</footer>
    </div>
  );
}
