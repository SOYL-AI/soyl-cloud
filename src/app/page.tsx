import { ArrowRight, Play, Check, ShieldCheck, Hotel, Bed, UtensilsCrossed } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal, RevealGroup, RevealOnLoad } from "@/components/ui/Reveal";
import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { InteractiveConciergeChat } from "@/components/mockups/InteractiveConciergeChat";
import { InteractiveHeroGuestPortal } from "@/components/mockups/InteractiveHeroGuestPortal";
import { MetricsStrip } from "@/components/sections/MetricsStrip";
import { AdvisorTeaser } from "@/components/sections/AdvisorTeaser";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { ProductSchema } from "@/components/seo/SchemaInjector";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { AripNodeDiagram } from "@/components/animations/AripNodeDiagram";

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
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-[#0A0D14]">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-[#0A0D14] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[600px] bg-[var(--background-image-gradient-glow)] opacity-30 pointer-events-none" />

        <Container>
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <Badge variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-md" dot>INTRODUCING: Autonomous Revenue Intelligence</Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-8 text-balance">
              <TypewriterText text="The hotel defines the destination. Our AI navigates the journey." wordClassName="text-white" />
            </h1>

            <p
              className="text-lg md:text-2xl text-gray-200 mb-10 max-w-3xl leading-relaxed font-medium text-balance drop-shadow"
            >
              Say goodbye to passive dashboards. Deploy a synchronized workforce of AI agents that autonomously execute pricing, marketing, and operations.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto relative z-20">
              <Button size="lg" href="/contact" className="w-full sm:w-auto bg-white text-[#0A0D14] hover:bg-gray-100 font-bold px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all group">
                Join Pilot Waitlist
                <ArrowRight size={20} className="ml-2 text-[#0A0D14] transition-transform group-hover:translate-x-1 inline-block" />
              </Button>
              <Button size="lg" variant="outline" href="#products" className="w-full sm:w-auto bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md font-semibold px-8 py-3.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all">
                <Play size={18} className="mr-2 text-soyl-mint inline-block fill-soyl-mint/20" />
                See How It Works
              </Button>
            </div>
          </div>

          {/* Hero Mockups Showcase */}
          <RevealOnLoad
            delay={0.4}
            className="mt-16 md:mt-24 relative max-w-[1200px] mx-auto"
          >
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 relative">
              <div className="w-full lg:w-4/5 max-w-4xl relative z-10">
                <BrowserMockup
                  src="/images/soyl_hero_main.png"
                  alt="The PMS Lite dashboard, showing today's arrivals, room status and open service requests"
                  glow
                  priority
                />
              </div>

              <div className="w-[280px] lg:w-[320px] lg:absolute lg:-right-4 lg:-bottom-8 z-20">
                <PhoneMockup float priority>
                  <InteractiveHeroGuestPortal />
                </PhoneMockup>
              </div>

            </div>
          </RevealOnLoad>
        </Container>
      </section>

      {/* 2. BUTLER AI FLAGSHIP SECTION (LAUNCHED PRODUCT FIRST) */}
      <section id="products" className="py-24 md:py-32 bg-[var(--color-soyl-gray-50)] border-y border-[var(--color-soyl-gray-200)]">
        <Container>
          <SectionHeader
            badge="Butler AI — Available Now"
            title="The AI concierge your guests actually use."
            description="No app download. No training. No friction. Guests scan QR, speak or type, and Butler AI handles concierge, room service, and requests in 50+ languages."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="order-2 md:order-1 flex justify-center">
              <PhoneMockup priority>
                <InteractiveConciergeChat />
              </PhoneMockup>
            </div>
            
            <div className="order-1 md:order-2">
              <RevealGroup className="flex flex-col gap-8">
                <div>
                  <h3 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-4">Instant responses, zero front-desk delays.</h3>
                  <p className="text-lg text-[var(--color-soyl-gray-600)] leading-relaxed">
                    Stop letting front desk queues ruin guest experience scores. Butler AI answers guest inquiries in under 2 seconds and routes requests directly to staff.
                  </p>
                </div>
                
                <ul className="flex flex-col gap-6">
                  {[
                    { title: "Multilingual Voice & Text", desc: "Instantly translates and converses naturally in over 50 languages." },
                    { title: "Smart Department Routing", desc: "Food orders go to F&B, extra towels to Housekeeping. Automatically." },
                    { title: "Zero-Party Guest Intent Engine", desc: "Extracts guest preferences (anniversaries, high floors, dining tastes) to boost direct upsells." }
                  ].map((item, i) => (
                    <Reveal key={i} as="li" className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-soyl-mint-light)] flex items-center justify-center text-[var(--color-soyl-mint-dark)] shrink-0 font-bold">
                        <Check size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[var(--color-soyl-charcoal)] mb-1">{item.title}</h4>
                        <p className="text-[var(--color-soyl-gray-600)]">{item.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </ul>

                <Reveal className="pt-2">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="primary" size="lg" href="/products/butler-ai" className="group">
                      Explore Butler AI
                      <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button variant="outline" size="lg" href="/contact">
                      Start 1-Month Free Trial
                    </Button>
                  </div>
                </Reveal>
              </RevealGroup>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. METRICS STRIP & HOTEL ADVISOR */}
      <MetricsStrip />
      <AdvisorTeaser />

      {/* 4. ARIP FLAGSHIP PRODUCT SECTION (COMING SOON) */}
      <section id="arip" className="py-24 md:py-32 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-6 bg-[#E8F5F3] text-[#3D8F87] border-[#6DBAB2]/40">Coming Soon &bull; Join Pilot Waitlist</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6 text-balance">
              Introducing ARIP: Your Hotel&apos;s Autonomous Digital Workforce.
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed text-balance">
              Not just software. A synchronized team of specialized AI agents that autonomously execute pricing, launch marketing campaigns, and grow RevPAR around the clock.
            </p>
          </div>

          {/* ARIP Make.com / N8N Style Node Pipeline */}
          <div className="mb-16">
            <div className="w-full max-w-6xl mx-auto">
              <AripNodeDiagram />
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" href="/products/arip" className="bg-[#0A0D14] text-white hover:bg-black font-bold px-8 py-3.5 rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all group">
              Explore Technical Architecture & XAI Logs
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1 inline-block" />
            </Button>
          </div>
        </Container>
      </section>

      {/* 5. PMS LITE SECTION */}
      <section className="py-24 md:py-32 bg-[var(--color-soyl-gray-50)] border-t border-[var(--color-soyl-gray-200)]">
        <Container>
          <SectionHeader
            badge="PMS Lite"
            title="The simplest PMS your staff will love."
            description="Flat ₹9,999/month. Unlimited rooms. No training required. The affordable alternative to Opera and Cloudbeds."
          />

          <Reveal className="mb-12">
            <BrowserMockup src="/images/pms-lite-hero.jpg" alt="PMS Lite Dashboard" glow />
          </Reveal>

          <div className="text-center">
            <Button variant="outline" size="lg" href="/products/pms-lite">
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
                  &ldquo;Since switching to SOYL Cloud, our guest satisfaction scores jumped from 8.2 to 9.6. The front desk is finally calm.&rdquo;
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
