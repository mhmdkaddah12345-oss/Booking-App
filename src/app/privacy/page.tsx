import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { cardClass, cardAccentBarClass } from "@/lib/ui";
import { whatsappLink } from "@/lib/whatsapp";

const CONTACT_PHONE = "79070947";
const LAST_UPDATED = "10 August 2026";

export const metadata = {
  title: "Privacy Policy — Maw3ed",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Wordmark />
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            ← Back home
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Privacy Policy</h1>
        <p className="mt-1 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

        <div className={`mt-6 ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="flex flex-col gap-6 p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-zinc-600">
              Maw3ed (“we”, “us”, “Maw3ed”) provides a booking-page platform that lets businesses
              (salons, clinics, gyms, and similar service providers) accept appointments online.
              This page explains what information we collect, why we collect it, and how it’s
              used — for both business owners who sign up for Maw3ed and their customers who book
              through a Maw3ed booking page.
            </p>

            <Section title="Information we collect">
              <p>From a business owner, when you sign up or use your dashboard:</p>
              <ul className="ms-4 list-disc">
                <li>Your name, email address, and phone number</li>
                <li>Your business name, hours, services, staff names, and booking page content (photos, description, FAQs)</li>
                <li>Payment confirmations you report to us for your subscription (we do not collect or store card numbers — see “Payments” below)</li>
              </ul>
              <p className="mt-2">From a customer booking an appointment through a business’s Maw3ed page:</p>
              <ul className="ms-4 list-disc">
                <li>Name and phone number, provided when making or managing a booking</li>
                <li>Appointment details — the service, date, time, and any note left for the business</li>
              </ul>
            </Section>

            <Section title="How we use this information">
              <ul className="ms-4 list-disc">
                <li>To operate the booking system — creating, confirming, rescheduling, and cancelling appointments</li>
                <li>To send booking-related notifications (WhatsApp messages, push notifications, and emails) to business owners and their customers</li>
                <li>To let a business owner see their own customer history and manage their own booking page</li>
                <li>To manage subscriptions and trial periods for business accounts</li>
                <li>To respond if you contact us for support</li>
              </ul>
              <p className="mt-2">We do not sell customer or business data to third parties, and we do not use it for advertising.</p>
            </Section>

            <Section title="Who can see your information">
              <p>
                A customer’s booking details (name, phone, appointment info) are visible to the
                specific business they booked with — that’s the whole point of the booking page —
                but not to other businesses on Maw3ed. Business account details are visible to
                Maw3ed for the purpose of running the platform and are not shared with other
                businesses.
              </p>
            </Section>

            <Section title="Third-party services we use">
              <ul className="ms-4 list-disc">
                <li><strong>Supabase</strong> — hosts our database, where all account and booking data is stored</li>
                <li><strong>Vercel</strong> — hosts the Maw3ed website and app</li>
                <li><strong>WhatsApp</strong> — used to send booking confirmations and messages when a phone number is provided; this opens WhatsApp’s own chat interface and is subject to WhatsApp’s own privacy terms</li>
                <li><strong>Resend</strong> — used to send transactional emails (e.g. account-related messages)</li>
                <li><strong>Whish Money</strong> — used for business owners to pay their Maw3ed subscription; Maw3ed does not process or store payment card details itself (see “Payments” below)</li>
              </ul>
              <p className="mt-2">Each of these providers processes data only as needed to provide their service to Maw3ed.</p>
            </Section>

            <Section title="Payments">
              <p>
                Subscription payments are currently made directly through Whish Money, outside of
                Maw3ed’s own systems. Maw3ed does not receive or store your card or Whish account
                credentials. We only record that a payment was reported and, once confirmed, the
                dates your subscription covers.
              </p>
            </Section>

            <Section title="Cookies and local storage">
              <p>
                Maw3ed uses your browser’s local storage to remember simple preferences, such as
                your chosen display language (English/Arabic) and your login session. We don’t use
                third-party advertising or tracking cookies.
              </p>
            </Section>

            <Section title="Data retention">
              <p>
                We keep account and booking data for as long as a business account is active. If a
                business owner closes their account or asks us to delete their data, we’ll remove
                it within a reasonable time, except where we’re required to keep records (for
                example, for accounting purposes).
              </p>
            </Section>

            <Section title="Your rights">
              <p>
                You can ask us what information we hold about you, ask us to correct it, or ask us
                to delete it, by contacting us using the details below. Business owners can also
                update or remove most of their own information directly from their dashboard
                Settings page.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                If we make material changes to this policy, we’ll update the date at the top of
                this page. Continued use of Maw3ed after a change means you accept the updated
                policy.
              </p>
            </Section>

            <Section title="Contact us">
              <p>
                Questions about this policy or your data can be sent to us on WhatsApp at{" "}
                <a
                  href={whatsappLink(CONTACT_PHONE, "Hi Maw3ed, I have a question about the privacy policy.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-800 underline"
                >
                  {CONTACT_PHONE}
                </a>
                . See also our{" "}
                <Link href="/terms" className="font-medium text-zinc-800 underline">
                  Terms of Service
                </Link>
                .
              </p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
