"use client";

import { 
  ArrowRight, 
  LayoutDashboard, 
  LineChart, 
  CreditCard, 
  Check, 
  X 
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { ProductSchema } from "@/components/seo/SchemaInjector";

export default function PmsLitePage() {
  return (
    <div className="flex flex-col">
      <ProductSchema
        name="PMS Lite"
        description="Property management software that your staff will actually enjoy using."
        category="SoftwareApplication"
      />
      <StickyCTA title="PMS Lite — Property Management" />

      {/* 1. HERO */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-white overflow-hidden">
        <Container size="lg" className="text-center">
          <RevealGroup className="flex flex-col items-center">
            <Reveal>
              <Badge variant="outline" className="mb-8">
                Property Management, Reimagined
              </Badge>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] leading-[1.05] mb-6 max-w-4xl mx-auto">
                The PMS that feels like it was built for humans.
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-lg md:text-xl text-[var(--color-soyl-gray-600)] max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
                No 3-day onboarding. No 50-page manual. No per-room pricing. PMS Lite is property management software that your staff will actually enjoy using — starting from day one.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 md:mb-24">
                <Button 
                  size="lg" 
                  variant="primary" 
                  href="https://soyl-web.gentlemushroom-c01a434f.centralindia.azurecontainerapps.io/en" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  Start Free PMS Trial
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" href="/pricing">
                  View Pricing
                </Button>
              </div>
            </Reveal>
          </RevealGroup>

          <Reveal delay={0.4}>
            <div className="relative max-w-5xl mx-auto">
              <BrowserMockup 
                src="/images/pms-lite-hero.jpg" 
                alt="PMS Lite Dashboard" 
                glow={true} 
                priority={true} 
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 2. DIFFERENTIATOR STRIP */}
      <section className="py-16 bg-[var(--color-soyl-charcoal)] text-white">
        <Container>
          <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
            <Reveal className="py-4 md:py-0 px-4">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">₹9,999/month</div>
              <div className="text-[var(--color-soyl-gray-400)] text-sm md:text-base font-medium">Flat rate. Any size property.</div>
            </Reveal>
            <Reveal delay={0.1} className="py-4 md:py-0 px-4">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">&lt; 1 Hour</div>
              <div className="text-[var(--color-soyl-gray-400)] text-sm md:text-base font-medium">Setup time from sign-up to live.</div>
            </Reveal>
            <Reveal delay={0.2} className="py-4 md:py-0 px-4">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-white tracking-tight">Unlimited Rooms</div>
              <div className="text-[var(--color-soyl-gray-400)] text-sm md:text-base font-medium">No per-room fees. Ever.</div>
            </Reveal>
          </RevealGroup>
        </Container>
      </section>

      {/* 3. FEATURE SECTIONS */}
      {/* Section A */}
      <section className="py-24 bg-white overflow-hidden">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <RevealGroup>
                <Reveal>
                  <Badge variant="outline" className="mb-6 bg-blue-50 text-blue-600 border-blue-100">
                    <LayoutDashboard size={14} className="mr-2 inline-block" /> Check-in
                  </Badge>
                </Reveal>
                <Reveal delay={0.1}>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
                    Check-in in 10 seconds.
                  </h2>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="text-lg text-[var(--color-soyl-gray-600)] mb-8 leading-relaxed max-w-lg">
                    A front-desk interface built for speed. Pull up a reservation, assign a room, and complete check-in before the guest has finished signing. No multi-screen maze.
                  </p>
                </Reveal>
                <Reveal delay={0.3}>
                  <ul className="flex flex-col gap-4">
                    {[
                      "Instant reservation lookup",
                      "One-click room assignment",
                      "Digital registration cards sent automatically"
                    ].map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 bg-[var(--color-soyl-mint)]/20 rounded-full p-1 text-[var(--color-soyl-mint-dark)] shrink-0">
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[var(--color-soyl-charcoal)] font-medium">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </RevealGroup>
            </div>
            <div className="flex-[1.2] w-full">
              <Reveal delay={0.2}>
                <BrowserMockup src="/images/soyl_hero_main.png" alt="PMS Lite Check-in" className="shadow-2xl shadow-gray-200" />
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Section B */}
      <section className="py-24 bg-[var(--color-soyl-gray-50)] overflow-hidden">
        <Container>
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1">
              <RevealGroup>
                <Reveal>
                  <Badge variant="outline" className="mb-6 bg-purple-50 text-purple-600 border-purple-100">
                    <LineChart size={14} className="mr-2 inline-block" /> Night Audit
                  </Badge>
                </Reveal>
                <Reveal delay={0.1}>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
                    Night audit that runs itself.
                  </h2>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="text-lg text-[var(--color-soyl-gray-600)] mb-8 leading-relaxed max-w-lg">
                    End-of-day shouldn&apos;t take an hour. PMS Lite closes the day, posts charges, reconciles payments, and exports your summary — in one click.
                  </p>
                </Reveal>
                <Reveal delay={0.3}>
                  <ul className="flex flex-col gap-4">
                    {[
                      "Automated charge posting",
                      "One-click daily summary",
                      "Revenue reports ready by 6 AM"
                    ].map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 bg-[var(--color-soyl-mint)]/20 rounded-full p-1 text-[var(--color-soyl-mint-dark)] shrink-0">
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[var(--color-soyl-charcoal)] font-medium">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </RevealGroup>
            </div>
            <div className="flex-[1.2] w-full">
              <Reveal delay={0.2}>
                <div className="bg-[#1C1C1E] rounded-[2rem] p-8 shadow-2xl shadow-gray-300 overflow-hidden font-mono text-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-2 text-gray-400">daily-summary-audit.sh</span>
                  </div>
                  <div className="text-green-400 mb-2">&gt; Initializing Night Audit sequence...</div>
                  <div className="text-gray-300 mb-2">[OK] Room charges posted automatically.</div>
                  <div className="text-gray-300 mb-2">[OK] POS settlements reconciled.</div>
                  <div className="text-gray-300 mb-4">[OK] No-shows flagged and billed.</div>
                  
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 mb-4">
                    <div className="text-white mb-2 font-bold">Night Audit Summary — 06 Aug 2026</div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Total Revenue:</span><span className="text-white">₹ 1,42,500</span>
                    </div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Occupancy:</span><span className="text-white">84%</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>ADR:</span><span className="text-white">₹ 4,250</span>
                    </div>
                  </div>
                  <div className="text-blue-400 animate-pulse">&gt; Report exported to Managers. Day closed.</div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Section C */}
      <section className="py-24 bg-white overflow-hidden">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <RevealGroup>
                <Reveal>
                  <Badge variant="outline" className="mb-6 bg-emerald-50 text-emerald-600 border-emerald-100">
                    <CreditCard size={14} className="mr-2 inline-block" /> Billing
                  </Badge>
                </Reveal>
                <Reveal delay={0.1}>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
                    Billing that doesn&apos;t need an accountant.
                  </h2>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="text-lg text-[var(--color-soyl-gray-600)] mb-8 leading-relaxed max-w-lg">
                    Guest folios are automatic. Every charge — room, restaurant, minibar — posts to the right folio in real-time. Checkout is a print and a signature.
                  </p>
                </Reveal>
                <Reveal delay={0.3}>
                  <ul className="flex flex-col gap-4">
                    {[
                      "Real-time charge posting",
                      "Split folios for group bookings",
                      "PDF invoices with one tap"
                    ].map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 bg-[var(--color-soyl-mint)]/20 rounded-full p-1 text-[var(--color-soyl-mint-dark)] shrink-0">
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[var(--color-soyl-charcoal)] font-medium">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </RevealGroup>
            </div>
            <div className="flex-[1.2] w-full">
              <Reveal delay={0.2}>
                <BrowserMockup src="/images/revenue_dashboard.png" alt="Revenue Dashboard" className="shadow-2xl shadow-gray-200 border border-gray-100 rounded-[2rem]" />
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. VS SECTION */}
      <section className="py-24 bg-[var(--color-soyl-gray-50)]">
        <Container>
          <RevealGroup className="max-w-4xl mx-auto">
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-soyl-charcoal)] mb-4">
                  Why PMS Lite over the alternatives?
                </h2>
                <p className="text-[var(--color-soyl-gray-600)] text-lg">
                  Legacy systems are bloated and expensive. We built PMS Lite to be fast, simple, and transparent.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-6 md:p-8 bg-white border-b border-gray-100 w-1/3"></th>
                        <th className="p-6 md:p-8 bg-[var(--color-soyl-mint)]/10 border-b border-[var(--color-soyl-mint)]/20 w-1/3 text-center">
                          <span className="text-[var(--color-soyl-mint-dark)] font-bold text-lg md:text-xl">PMS Lite</span>
                        </th>
                        <th className="p-6 md:p-8 bg-white border-b border-gray-100 w-1/6 text-center text-gray-500 font-semibold">Opera / IDS</th>
                        <th className="p-6 md:p-8 bg-white border-b border-gray-100 w-1/6 text-center text-gray-500 font-semibold">Cloudbeds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { label: "Monthly Price", lite: "₹9,999 flat", opera: "₹50,000+", cloudbeds: "₹25,000+" },
                        { label: "Setup Time", lite: "< 1 hour", opera: "2-3 weeks", cloudbeds: "3-5 days" },
                        { label: "Training Required", lite: "None", opera: "3-day course", cloudbeds: "½ day" },
                        { label: "Mobile-First", lite: "✓", opera: "✗", cloudbeds: "Partial" },
                        { label: "AI Integration Ready", lite: "✓ (ARIP-ready)", opera: "✗", cloudbeds: "✗" },
                      ].map((row, i) => (
                        <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="p-6 md:p-8 font-medium text-[var(--color-soyl-charcoal)]">{row.label}</td>
                          <td className="p-6 md:p-8 bg-[var(--color-soyl-mint)]/5 group-hover:bg-[var(--color-soyl-mint)]/10 text-center font-semibold text-[var(--color-soyl-mint-dark)] transition-colors">
                            {row.lite === "✓" || row.lite.includes("✓") ? (
                              <div className="flex items-center justify-center gap-2">
                                <Check size={18} strokeWidth={3} />
                                {row.lite.replace("✓", "").trim()}
                              </div>
                            ) : row.lite}
                          </td>
                          <td className="p-6 md:p-8 text-center text-gray-500">
                            {row.opera === "✗" ? <X size={18} className="mx-auto text-gray-300" /> : row.opera}
                          </td>
                          <td className="p-6 md:p-8 text-center text-gray-500">
                            {row.cloudbeds === "✗" ? <X size={18} className="mx-auto text-gray-300" /> : row.cloudbeds}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </RevealGroup>
        </Container>
      </section>

      {/* 5. FINAL CTA */}
      <FinalCTA />
    </div>
  );
}
