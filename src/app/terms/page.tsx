import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { cardClass, cardAccentBarClass } from "@/lib/ui";
import { whatsappLink } from "@/lib/whatsapp";

const CONTACT_PHONE = "79070947";
const LAST_UPDATED = "10 August 2026";

export const metadata = {
  title: "Terms of Service — Maw3ed",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Wordmark />
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            ← Back home
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-zinc-900">Terms of Service</h1>
        <p className="mt-1 text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>

        <div className={`mt-6 ${cardClass}`}>
          <div className={cardAccentBarClass} />
          <div className="flex flex-col gap-6 p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-zinc-600">
              These terms govern your use of Maw3ed, a booking-page platform for local
              businesses. By creating a Maw3ed account or using a Maw3ed booking page, you agree
              to these terms. If you don’t agree, please don’t use Maw3ed.
            </p>

            <Section title="What Maw3ed is">
              <p>
                Maw3ed lets a business create its own online booking page, manage appointments,
                and communicate with its customers. Maw3ed is the platform; each business is
                responsible for the services it actually provides to its own customers.
              </p>
            </Section>

            <Section title="Business accounts">
              <ul className="ms-4 list-disc">
                <li>You must provide accurate information when signing up, and keep it up to date.</li>
                <li>You’re responsible for what you enter on your booking page (services, prices, photos, descriptions) and for actually honoring the appointments customers book with you.</li>
                <li>You’re responsible for keeping your login credentials secure. Let us know right away if you think your account has been accessed without your permission.</li>
                <li>New accounts get a free trial period. After the trial ends, continued access requires an active paid subscription.</li>
              </ul>
            </Section>

            <Section title="Subscriptions and payment">
              <ul className="ms-4 list-disc">
                <li>Subscription plans and pricing are shown on your Billing page and may change from time to time; we’ll display the current price before you pay.</li>
                <li>Payments are currently made manually via Whish Money. Your access is extended once we’ve confirmed the payment was received.</li>
                <li>If a subscription lapses, your booking page and dashboard are locked until you renew — your data isn’t deleted, just inaccessible until payment resumes.</li>
                <li>Payments already made for a subscription period are non-refundable, except where required by law.</li>
              </ul>
            </Section>

            <Section title="Acceptable use">
              <p>You agree not to use Maw3ed to:</p>
              <ul className="ms-4 list-disc">
                <li>Impersonate a business you don’t own or operate, or post false information about a business</li>
                <li>Send spam, harassment, or unsolicited messages to customers</li>
                <li>Attempt to disrupt, overload, or gain unauthorized access to Maw3ed’s systems or another business’s account</li>
                <li>Use Maw3ed for anything illegal under applicable law</li>
              </ul>
              <p className="mt-2">We may suspend or close an account that violates these terms.</p>
            </Section>

            <Section title="Customer bookings">
              <p>
                When a customer books an appointment through a business’s Maw3ed page, that
                booking is an arrangement between the customer and the business — Maw3ed provides
                the booking tool but isn’t a party to that appointment. Cancellations,
                rescheduling, and disputes about a specific appointment are between the customer
                and the business.
              </p>
            </Section>

            <Section title="Service availability">
              <p>
                We aim to keep Maw3ed running reliably, but we don’t guarantee the service will
                always be available or error-free. We’re not liable for lost bookings or business
                caused by downtime, outages, or issues with third-party services Maw3ed depends on
                (such as our hosting or database provider).
              </p>
            </Section>

            <Section title="Limitation of liability">
              <p>
                Maw3ed is provided “as is.” To the extent permitted by law, Maw3ed is not liable
                for indirect, incidental, or consequential damages arising from your use of the
                platform, including lost revenue or lost data. Our total liability for any claim
                relating to Maw3ed is limited to the amount you paid us in the three months before
                the claim arose.
              </p>
            </Section>

            <Section title="Ending your account">
              <p>
                You can stop using Maw3ed at any time — contact us and we’ll close your account.
                We may also suspend or close an account for violating these terms, non-payment
                after a reasonable grace period, or if required by law.
              </p>
            </Section>

            <Section title="Changes to these terms">
              <p>
                We may update these terms as Maw3ed evolves. If we make material changes, we’ll
                update the date at the top of this page. Continued use of Maw3ed after a change
                means you accept the updated terms.
              </p>
            </Section>

            <Section title="Governing law">
              <p>These terms are governed by the laws of Lebanon.</p>
            </Section>

            <Section title="Contact us">
              <p>
                Questions about these terms can be sent to us on WhatsApp at{" "}
                <a
                  href={whatsappLink(CONTACT_PHONE, "Hi Maw3ed, I have a question about the terms of service.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-800 underline"
                >
                  {CONTACT_PHONE}
                </a>
                . See also our{" "}
                <Link href="/privacy" className="font-medium text-zinc-800 underline">
                  Privacy Policy
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
