/**
 * BlogHeader — the integration point for your navigation.
 *
 * If you have an existing header/navbar, replace this file's contents
 * with a component that matches the same props interface:
 *
 *   ({ items: { href: string; label: string }[] }) => JSX.Element
 *
 * The default implementation below is self-contained (zero extra deps).
 * Swap in your own navbar in seconds — no other files need to change.
 */

import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Content8";

export default function BlogHeader({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-semibold text-zinc-100 shrink-0 tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
