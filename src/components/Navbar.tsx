import { Github, Menu, Rss } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Auto Blog";

export default function Navbar({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl text-white">{SITE_NAME}</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-300 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden md:flex items-center space-x-4">
          <Link
            href="/blog/rss.xml"
            className="text-gray-400 hover:text-white transition-colors"
            title="RSS Feed"
          >
            <Rss className="h-5 w-5" />
          </Link>
        </div>

        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-gray-800 bg-gray-900">
              <div className="flex flex-col space-y-4 mt-8">
                <nav className="flex flex-col space-y-4">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors text-lg font-medium py-2 px-4 rounded-md hover:bg-gray-800/50"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center px-4 space-x-4 pt-6 border-t border-gray-800">
                  <Link
                    href="/blog/rss.xml"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Rss className="h-6 w-6" />
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
