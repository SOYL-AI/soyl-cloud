"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, MessageSquare, LayoutDashboard, UtensilsCrossed, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        className={`pointer-events-auto w-full max-w-6xl transition-all duration-300 py-2.5 px-5 md:px-6 ${
          isOpen ? "rounded-3xl" : "rounded-full"
        } ${
          scrolled
            ? "bg-white/95 border border-gray-200/80 backdrop-blur-2xl shadow-xl text-gray-900"
            : "bg-[#0A0D14]/95 border border-white/15 backdrop-blur-2xl shadow-2xl text-white"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#6DBAB2] to-[#3D8F87] p-0.5 shadow-sm">
              <Image src="/images/logo.png" alt="SOYL AI Logo" width={32} height={32} className="w-full h-full object-contain rounded-full bg-[#0A0D14]" />
            </div>
            <span className={`font-bold text-lg tracking-tight transition-colors ${scrolled ? "text-gray-900 group-hover:text-[var(--color-soyl-mint-dark)]" : "text-white group-hover:text-soyl-mint"}`}>
              SOYL Cloud
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Products Dropdown */}
            <div className="relative group">
              <button className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${
                scrolled 
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80" 
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}>
                Products <ChevronDown size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-full left-1/2 -translate-x-1/2 pt-3 w-80">
                <div className={`backdrop-blur-2xl rounded-2xl shadow-2xl border p-3 flex flex-col gap-1 transition-all ${
                  scrolled 
                    ? "bg-white/95 border-gray-200 text-gray-900" 
                    : "bg-[#0A0D14]/95 border-white/10 text-white"
                }`}>
                  <Link href="/advisor" className={`flex items-start gap-3 p-3 rounded-xl transition-colors group/item border border-transparent ${
                    scrolled ? "hover:bg-gray-50 hover:border-[#6DBAB2]/30" : "hover:bg-white/5 hover:border-[#6DBAB2]/20"
                  }`}>
                    <div className="w-9 h-9 rounded-lg bg-[#6DBAB2]/20 border border-[#6DBAB2]/40 flex items-center justify-center text-[#3D8F87] shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-semibold text-sm flex items-center justify-between ${scrolled ? "text-gray-900" : "text-white"}`}>
                        Hotel Advisor
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-[#6DBAB2]/20 text-[#3D8F87] border border-[#6DBAB2]/30 px-1.5 py-0.5 rounded-full">Free Tool</span>
                      </div>
                      <div className={`text-xs ${scrolled ? "text-gray-500" : "text-gray-400"}`}>Ask SOPs & policy documents instantly</div>
                    </div>
                  </Link>

                  <Link href="/products/butler-ai" className={`flex items-start gap-3 p-3 rounded-xl transition-colors group/item border border-transparent ${
                    scrolled ? "hover:bg-gray-50 hover:border-emerald-100" : "hover:bg-white/5 hover:border-emerald-500/20"
                  }`}>
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-semibold text-sm flex items-center justify-between ${scrolled ? "text-gray-900" : "text-white"}`}>
                        Butler AI
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">Live</span>
                      </div>
                      <div className={`text-xs ${scrolled ? "text-gray-500" : "text-gray-400"}`}>AI concierge for guest requests</div>
                    </div>
                  </Link>

                  <Link href="/products/arip" className={`flex items-start gap-3 p-3 rounded-xl transition-colors group/item border border-transparent ${
                    scrolled ? "hover:bg-gray-50 hover:border-blue-100" : "hover:bg-white/5 hover:border-blue-500/20"
                  }`}>
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-semibold text-sm flex items-center justify-between ${scrolled ? "text-gray-900" : "text-white"}`}>
                        ARIP Platform
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">Soon</span>
                      </div>
                      <div className={`text-xs ${scrolled ? "text-gray-500" : "text-gray-400"}`}>Autonomous digital workforce</div>
                    </div>
                  </Link>

                  <Link href="/products/pms-lite" className={`flex items-start gap-3 p-3 rounded-xl transition-colors group/item border border-transparent ${
                    scrolled ? "hover:bg-gray-50" : "hover:bg-white/5"
                  }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${scrolled ? "bg-gray-100 text-gray-700" : "bg-white/10 text-gray-300"}`}>
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-semibold text-sm ${scrolled ? "text-gray-900" : "text-white"}`}>PMS Lite</div>
                      <div className={`text-xs ${scrolled ? "text-gray-500" : "text-gray-400"}`}>Property management & operations</div>
                    </div>
                  </Link>

                  <Link href="/products/soyl-dine" className={`flex items-start gap-3 p-3 rounded-xl transition-colors group/item border border-transparent ${
                    scrolled ? "hover:bg-gray-50" : "hover:bg-white/5"
                  }`}>
                    <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400 shrink-0">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-semibold text-sm flex items-center justify-between ${scrolled ? "text-gray-900" : "text-white"}`}>
                        SOYL Dine
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${scrolled ? "bg-gray-100 text-gray-600" : "bg-white/10 text-gray-400"}`}>Soon</span>
                      </div>
                      <div className={`text-xs ${scrolled ? "text-gray-500" : "text-gray-400"}`}>Restaurant POS & management</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Featured Hotel Advisor Pill */}
            <Link
              href="/advisor"
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                scrolled
                  ? "bg-[#E8F5F3] border border-[#6DBAB2]/40 text-[#3D8F87] hover:bg-[#D5EFEA] shadow-sm"
                  : "bg-[#6DBAB2]/15 border border-[#6DBAB2]/40 text-[#6DBAB2] hover:bg-[#6DBAB2]/25 shadow-[0_0_12px_rgba(109,186,178,0.25)]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#3D8F87]" />
              Hotel Advisor
            </Link>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${
                scrolled 
                  ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80" 
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}>
                Resources <ChevronDown size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-full left-0 pt-3 w-56">
                <div className={`backdrop-blur-2xl rounded-2xl shadow-2xl border p-2 flex flex-col gap-0.5 transition-all ${
                  scrolled 
                    ? "bg-white/95 border-gray-200 text-gray-900" 
                    : "bg-[#0A0D14]/95 border-white/10 text-white"
                }`}>
                  <Link href="/blog" className={`p-2.5 rounded-xl text-sm font-medium transition-colors ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`}>
                    Blog
                  </Link>
                  <Link href="/compare" className={`p-2.5 rounded-xl text-sm font-medium transition-colors ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`}>
                    Compare Butler AI
                  </Link>
                  <Link href="/about" className={`p-2.5 rounded-xl text-sm font-medium transition-colors ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`}>
                    About SOYL
                  </Link>
                  <Link href="/contact" className={`p-2.5 rounded-xl text-sm font-medium transition-colors ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`}>
                    Contact Team
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/pricing" className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${
              scrolled 
                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80" 
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}>
              Pricing
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/contact"
              className={`font-bold text-xs tracking-wide px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 ${
                scrolled
                  ? "bg-[#0A0D14] text-white hover:bg-black shadow-md"
                  : "bg-white text-[#0A0D14] hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              }`}
            >
              Join Pilot Waitlist →
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`md:hidden p-2 transition-colors ${scrolled ? "text-gray-700 hover:text-gray-900" : "text-gray-300 hover:text-white"}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          id="mobile-menu"
          inert={!isOpen}
          aria-hidden={!isOpen}
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
            isOpen ? `max-h-[500px] opacity-100 mt-4 pt-4 border-t ${scrolled ? "border-gray-200" : "border-white/10"}` : "max-h-0 opacity-0"
          }`}
        >
          <div className={`flex flex-col gap-2 pb-2 ${scrolled ? "text-gray-900" : "text-white"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-1 ${scrolled ? "text-gray-500" : "text-gray-400"}`}>Products & Tools</p>
            <Link href="/advisor" className="px-3 py-2 rounded-xl bg-[#6DBAB2]/20 text-[#3D8F87] font-bold text-sm flex items-center justify-between" onClick={() => setIsOpen(false)}>
              Hotel Advisor <span className="text-[10px] bg-[#6DBAB2]/30 px-2 py-0.5 rounded-full">FREE</span>
            </Link>
            <Link href="/products/butler-ai" className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`} onClick={() => setIsOpen(false)}>
              Butler AI <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">LIVE</span>
            </Link>
            <Link href="/products/arip" className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`} onClick={() => setIsOpen(false)}>
              ARIP Platform <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full">SOON</span>
            </Link>
            <Link href="/products/pms-lite" className={`px-3 py-2 rounded-xl text-sm font-medium ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`} onClick={() => setIsOpen(false)}>
              PMS Lite
            </Link>
            
            <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mt-3 mb-1 ${scrolled ? "text-gray-500" : "text-gray-400"}`}>Navigation</p>
            <Link href="/pricing" className={`px-3 py-2 rounded-xl text-sm font-medium ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`} onClick={() => setIsOpen(false)}>Pricing</Link>
            <Link href="/blog" className={`px-3 py-2 rounded-xl text-sm font-medium ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`} onClick={() => setIsOpen(false)}>Blog</Link>
            <Link href="/contact" className={`px-3 py-2 rounded-xl text-sm font-medium ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`} onClick={() => setIsOpen(false)}>Contact</Link>
            
            <div className="mt-3 pt-2">
              <Link href="/contact" className={`w-full block text-center font-bold text-xs py-3 rounded-full shadow-lg ${scrolled ? "bg-[#0A0D14] text-white" : "bg-white text-[#0A0D14]"}`} onClick={() => setIsOpen(false)}>
                Join Pilot Waitlist →
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
