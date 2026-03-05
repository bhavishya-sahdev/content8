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

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Blog";

export default function BlogHeader({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-bold text-xl text-white shrink-0">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
