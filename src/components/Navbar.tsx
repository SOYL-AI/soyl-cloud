"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, MessageSquare, LayoutDashboard, Utensils } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
                <Link href="/butler-ai" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="w-10 h-10 bg-[var(--color-soyl-mint-light)] rounded-lg flex items-center justify-center text-[var(--color-soyl-mint-dark)] shrink-0 mt-0.5">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Butler AI</div>
                    <div className="text-xs text-gray-500">AI concierge for guest requests</div>
                  </div>
                </Link>
                <Link href="/pms-lite" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">PMS Lite</div>
                    <div className="text-xs text-gray-500">Property management & operations</div>
                  </div>
                </Link>
                <Link href="/soyl-dine" className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">SOYL Dine <span className="ml-2 text-[10px] uppercase tracking-wide bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm">Coming Soon</span></div>
                    <div className="text-xs text-gray-500">Restaurant POS & management</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <Link href="/pricing" className="px-4 py-2 text-sm font-medium text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-charcoal)] rounded-lg hover:bg-gray-50 transition-all">Pricing</Link>
          <Link href="/about" className="px-4 py-2 text-sm font-medium text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-charcoal)] rounded-lg hover:bg-gray-50 transition-all">About</Link>
          <Link href="/contact" className="px-4 py-2 text-sm font-medium text-[var(--color-soyl-gray-600)] hover:text-[var(--color-soyl-charcoal)] rounded-lg hover:bg-gray-50 transition-all">Contact</Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button size="sm" variant="primary" href="/book-demo">
            Book Demo →
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2 text-[var(--color-soyl-gray-600)] hover:text-gray-900 transition-colors" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden shadow-lg absolute top-full left-0 w-full"
          >
            <div className="p-6 flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
              <Link href="/butler-ai" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>Butler AI</Link>
              <Link href="/pms-lite" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>PMS Lite</Link>
              <Link href="/soyl-dine" className="text-lg font-medium text-gray-500 py-2 flex items-center justify-between" onClick={() => setIsOpen(false)}>
                SOYL Dine
                <span className="text-[10px] uppercase tracking-wide bg-gray-200 text-gray-600 px-2 py-1 rounded-sm">Coming Soon</span>
              </Link>
              <hr className="my-3 border-gray-100" />
              <Link href="/pricing" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>Pricing</Link>
              <Link href="/about" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>About</Link>
              <Link href="/contact" className="text-lg font-medium text-gray-800 py-2" onClick={() => setIsOpen(false)}>Contact</Link>
              <div className="mt-4">
                <Button size="lg" className="w-full" href="/book-demo" onClick={() => setIsOpen(false)}>
                  Book Demo
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
