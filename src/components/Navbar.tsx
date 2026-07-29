"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, MessageSquare, LayoutDashboard, Utensils, UtensilsCrossed, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/Button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="SOYL AI Logo" width={36} height={36} className="w-9 h-9 object-contain" />
          <span className="font-bold text-xl tracking-tight text-[var(--color-soyl-charcoal)]">SOYL Cloud</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Products dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-charcoal)] rounded-lg hover:bg-gray-50 transition-all">
              Products <ChevronDown size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-full left-0 pt-2 w-72">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex flex-col gap-1">
                <Link href="/products/butler-ai" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-soyl-mint-light)] flex items-center justify-center text-[var(--color-soyl-mint-dark)] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Butler AI</div>
                    <div className="text-xs text-gray-500">AI concierge for guest requests</div>
                  </div>
                </Link>
                <Link href="/products/pms-lite" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[var(--color-soyl-charcoal)] shrink-0">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">PMS Lite</div>
                    <div className="text-xs text-gray-500">Property management & operations</div>
                  </div>
                </Link>
                <Link href="/products/soyl-dine" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">SOYL Dine <span className="ml-2 text-[10px] uppercase tracking-wide bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm">Coming Soon</span></div>
                    <div className="text-xs text-gray-500">Restaurant POS & management</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Resources dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-charcoal)] rounded-lg hover:bg-gray-50 transition-all">
              Resources <ChevronDown size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-full left-0 pt-2 w-56">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex flex-col gap-1">
                <Link href="/blog" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="font-semibold text-sm text-gray-900">Blog</div>
                </Link>
                <Link href="/compare" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="font-semibold text-sm text-gray-900">Compare Butler AI</div>
                </Link>
                <Link href="/about" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="font-semibold text-sm text-gray-900">About</div>
                </Link>
                <Link href="/contact" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="font-semibold text-sm text-gray-900">Contact</div>
                </Link>
              </div>
            </div>
          </div>

          <Link href="/pricing" className="px-4 py-2 text-sm font-medium text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-charcoal)] rounded-lg hover:bg-gray-50 transition-all">Pricing</Link>

        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" variant="primary" href="/book-demo">
            Book Demo →
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        {/* An icon is not a name. Without `aria-label` this button is
            announced as "button" and a screen reader user has no way to know
            it opens the menu. `aria-expanded` is what tells them whether it is
            currently open. */}
        <button
          className="md:hidden p-2 text-[var(--color-soyl-gray-600)] hover:text-gray-900 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
        </button>
      </div>

      {/* Mobile Nav */}
      {/* A CSS grid-rows transition rather than framer-motion.
          The Navbar is on every page, so its import decided whether the whole
          animation library shipped on the critical path of every marketing
          route — ~50 KB and the main-thread cost of hydrating it, to slide one
          panel. `grid-template-rows: 0fr -> 1fr` animates to auto height, which
          is the thing plain CSS could not do until recently and the reason
          this needed a library at all.

          Kept mounted and hidden rather than conditionally rendered, so it can
          animate out as well as in. `inert` keeps its links out of the tab
          order while closed — without it, a keyboard user tabs into a menu
          they cannot see. */}
      <div
        id="mobile-menu"
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`md:hidden absolute top-full left-0 w-full grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden bg-white border-b border-gray-100 shadow-lg">
            <div className="p-6 flex flex-col gap-2">
              <div className="flex flex-col gap-1 pl-4 border-l-2 border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
                <Link href="/products/butler-ai" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>Butler AI</Link>
                <Link href="/products/pms-lite" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>PMS Lite</Link>
                <Link href="/products/soyl-dine" className="text-lg font-medium text-gray-500 py-2 flex items-center justify-between" onClick={() => setIsOpen(false)}>
                  SOYL Dine <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">SOON</span>
                </Link>
              </div>
              <hr className="my-3 border-gray-100" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resources</p>
              <Link href="/blog" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>Blog</Link>
              <Link href="/compare" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>Compare Butler AI</Link>
              <Link href="/about" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>About</Link>
              <Link href="/contact" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>Contact</Link>
              <div className="mt-4">
                <Button size="lg" className="w-full" href="/book-demo" onClick={() => setIsOpen(false)}>
                  Book Demo
                </Button>
              </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
