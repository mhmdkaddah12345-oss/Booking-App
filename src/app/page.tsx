import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <h1 className="text-2xl font-semibold text-zinc-900">Booking pages for local businesses</h1>
        <p className="mt-2 text-sm text-zinc-500">
          A simple booking page for salons, clinics, and gyms — with automatic waitlist promotion when
          someone cancels.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create your booking page
          </Link>
          <Link
            href="/dashboard/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:underline"
          >
            Log in to your dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
