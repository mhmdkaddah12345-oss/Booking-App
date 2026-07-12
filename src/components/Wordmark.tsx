import Link from "next/link";

function CedarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2c1.8 2.6 3 4.6 3 6.4 0 1.4-.8 2.3-1.6 2.9 1.9.4 3.6 1.8 3.6 4 0 1.6-1 2.7-2 3.3 1.6.5 3 1.7 3 3.4H6c0-1.7 1.4-2.9 3-3.4-1-.6-2-1.7-2-3.3 0-2.2 1.7-3.6 3.6-4-.8-.6-1.6-1.5-1.6-2.9C9 6.6 10.2 4.6 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <CedarMark className="h-5 w-5 text-zinc-900" />
      <span className="font-display text-lg font-semibold tracking-tight text-zinc-800">Maw3ed</span>
    </Link>
  );
}
