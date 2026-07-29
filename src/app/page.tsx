import { ArrowRight, Play, Check, ShieldCheck, Hotel, Bed, UtensilsCrossed } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal, RevealGroup, RevealOnLoad } from "@/components/ui/Reveal";
import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { MetricsStrip } from "@/components/sections/MetricsStrip";
import { AdvisorTeaser } from "@/components/sections/AdvisorTeaser";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { ProductSchema } from "@/components/seo/SchemaInjector";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <ProductSchema
        name="SOYL Cloud"
        description="AI-powered hospitalty platform featuring Butler AI concierge and PMS Lite property management system."
        category="BusinessSoftware"
      />
      <StickyCTA />
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[var(--background-image-gradient-hero)] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[600px] bg-[var(--background-image-gradient-glow)] -z-10" />

        <Container>
          {/* Not animated. The h1 below is the LCP element, and an opacity
              tween on it delays LCP by exactly the tween's duration — the
              metric measures when the element reaches its final painted state.
              Above the fold, the fastest animation is none. */}
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <Badge variant="outline" dot>LIVE: AI-Powered Hospitality Platform</Badge>
            </div>

            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-soyl-charcoal)] leading-[1.05] mb-8"
            >
              Resolve guest requests in under <span className="text-[var(--color-soyl-mint-dark)]">30 seconds.</span>
            </h1>

            <p
              className="text-xl md:text-2xl text-[var(--color-soyl-gray-600)] mb-12 max-w-3xl leading-relaxed font-medium"
            >
              Your AI concierge handles room service, housekeeping, and guest communication — so your staff can focus on what matters. No app download. Works from day one.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" variant="primary" href="/book-demo" className="w-full sm:w-auto group">
                Book a Demo
                <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" href="#products" className="w-full sm:w-auto">
                <Play size={18} className="mr-2 text-[var(--color-soyl-mint-dark)]" />
                Watch Product Tour
              </Button>
            </div>
          </div>

          {/* Hero Mockups Showcase */}
          <RevealOnLoad
            delay={0.4}
            className="mt-20 md:mt-32 relative max-w-[1200px] mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-20 h-40 bottom-0 top-auto pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative">
              <div className="w-full md:w-3/5 relative z-10">
                <BrowserMockup
                  src="/images/soyl_hero_main.png"
                  alt="The PMS Lite dashboard, showing today's arrivals, room status and open service requests"
                  glow
                  priority
                />
              </div>
              <div className="w-[280px] md:w-[320px] md:absolute md:-right-4 lg:right-10 md:bottom-[-40px] z-20">
                <PhoneMockup 
                  src="/images/products_pics/Guest view initial landing .png"
                  alt="Butler AI Guest View"
                  float
                />
              </div>

              {/* Floating annotations */}
              <RevealOnLoad
                delay={1}
                className="absolute left-[10%] top-[20%] z-30 bg-white border border-[var(--color-soyl-gray-200)] shadow-xl rounded-2xl p-4 hidden lg:block"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-soyl-mint-light)] flex items-center justify-center text-[var(--color-soyl-mint-dark)]">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-soyl-charcoal)]">Request Routed</p>
                    <p className="text-xs text-[var(--color-soyl-gray-600)]">Sent to Housekeeping</p>
                  </div>
                </div>
              </RevealOnLoad>
            </div>
          </RevealOnLoad>
        </Container>
      </section>

      {/* 2. METRICS STRIP */}
      <MetricsStrip />

      {/* Directly after the metrics: the visitor has just seen the claims, and
          this is the one place they can test one themselves before committing
          to a demo call. */}
      <AdvisorTeaser />

      {/* 3. PRODUCT STORY / BUTLER AI */}
      <section id="products" className="py-24 md:py-32 bg-white">
        <Container>
          <SectionHeader
            badge="Butler AI"
            title="The AI concierge your guests actually use."
            description="No app download. No training. No friction. Guests scan, speak or type, and Butler AI handles everything in 50+ languages."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="order-2 md:order-1">
              <PhoneMockup src="/images/products_pics/COncierge chat asking something guest mode .png" />
            </div>
            
            <div className="order-1 md:order-2">
              <RevealGroup className="flex flex-col gap-10">
                <div>
                  <h3 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-4">Instant responses, zero delays.</h3>
                  <p className="text-lg text-[var(--color-soyl-gray-600)] leading-relaxed">
                    Stop letting front desk bottlenecks ruin guest experiences. Butler AI answers questions instantly and routes service requests directly to the right department.
                  </p>
                </div>
                
                <ul className="flex flex-col gap-6">
                  {[
                    { title: "Multilingual", desc: "Instantly translates and replies in over 50 languages." },
                    { title: "Voice & Text", desc: "Guests can send a voice note or type — just like chatting with a friend." },
                    { title: "Smart Routing", desc: "Food goes to the kitchen, towels to housekeeping. Automatically." }
                  ].map((item, i) => (
                    <Reveal key={i} as="li" className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-soyl-mint-light)] flex items-center justify-center text-[var(--color-soyl-mint-dark)] shrink-0">
                        <Check size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[var(--color-soyl-charcoal)] mb-1">{item.title}</h4>
                        <p className="text-[var(--color-soyl-gray-600)]">{item.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </ul>

                <Reveal>
                  <Button variant="outline" href="/products/butler-ai">
                    Explore Butler AI
                  </Button>
                </Reveal>
              </RevealGroup>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. PMS LITE SECTION */}
      <section className="py-24 md:py-32 bg-[var(--color-soyl-gray-50)] border-y border-[var(--color-soyl-gray-200)]">
        <Container>
          <SectionHeader
            badge="PMS Lite"
            title="Your property, one dashboard."
            description="Manage bookings, rooms, billing, and staff operations from a single, clean interface designed for speed."
          />

          <Reveal>
            <BrowserMockup src="/images/pms_dashboard_main.png" alt="PMS Lite Dashboard" glow />
          </Reveal>

          <div className="mt-16 text-center">
            <Button variant="outline" href="/products/pms-lite">
              Explore PMS Lite
            </Button>
          </div>
        </Container>
      </section>

      {/* 5. ROI / PROOF SECTION */}
      <section className="py-24 md:py-32 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
                The ROI is immediate.
              </h2>
              <p className="text-xl text-[var(--color-soyl-gray-600)] mb-10 leading-relaxed">
                By eliminating walkie-talkies, paper logs, and front desk bottlenecks, hotels see returns in their first month.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-[var(--color-soyl-gray-50)] rounded-2xl border border-[var(--color-soyl-gray-200)]">
                  <div className="text-4xl font-extrabold text-[var(--color-soyl-charcoal)] mb-2">₹2.4L</div>
                  <p className="text-sm font-medium text-[var(--color-soyl-gray-600)]">Saved per month in staff time</p>
                </div>
                <div className="p-6 bg-[var(--color-soyl-gray-50)] rounded-2xl border border-[var(--color-soyl-gray-200)]">
                  <div className="text-4xl font-extrabold text-[var(--color-soyl-charcoal)] mb-2">3×</div>
                  <p className="text-sm font-medium text-[var(--color-soyl-gray-600)]">More online reviews generated</p>
                </div>
              </div>
            </Reveal>

            <Reveal
              className="bg-[var(--color-soyl-charcoal)] rounded-[2rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-soyl-mint)] rounded-full blur-[80px] opacity-20 translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10">
                <div className="flex gap-1 mb-8">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-6 h-6 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-2xl md:text-3xl font-medium leading-tight mb-8">
                  "Since switching to SOYL Cloud, our guest satisfaction scores jumped from 8.2 to 9.6. The front desk is finally calm."
                </blockquote>
                <div>
                  <div className="font-bold text-lg">General Manager</div>
                  <div className="text-[var(--color-soyl-gray-400)]">Boutique Hotel Trial User</div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 6. TARGET AUDIENCE */}
      <section className="py-24 bg-[var(--color-soyl-gray-50)] border-t border-[var(--color-soyl-gray-200)]">
        <Container>
          <SectionHeader
            badge="Built For"
            title="Every kind of hospitality business."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Hotel, title: "Boutique Hotels", desc: "Elevate guest experience with AI concierge." },
              { icon: Bed, title: "Resorts & Villas", desc: "Multi-property management with centralized control." },
              { icon: ShieldCheck, title: "Hotel Chains", desc: "Enterprise dashboards with cross-property analytics." },
              { icon: UtensilsCrossed, title: "Restaurants", desc: "QR ordering and kitchen workflows." }
            ].map((item, i) => (
              <Reveal
                key={i}
                delay={i * 0.1}
                className="bg-white p-8 rounded-2xl border border-[var(--color-soyl-gray-200)] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[var(--color-soyl-gray-100)] rounded-xl flex items-center justify-center text-[var(--color-soyl-charcoal)] mb-6">
                  <item.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-3">{item.title}</h3>
                <p className="text-[var(--color-soyl-gray-600)]">{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* 7. FINAL CTA */}
      <FinalCTA />
    </>
  );
}
