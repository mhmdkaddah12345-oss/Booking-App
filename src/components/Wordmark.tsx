import Link from "next/link";
import Image from "next/image";

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Image src="/logo-icon.png" alt="" width={576} height={502} className="h-7 w-auto" priority />
      <span className="font-display text-lg font-semibold tracking-tight text-zinc-800">Maw3ed</span>
    </Link>
  );
}
