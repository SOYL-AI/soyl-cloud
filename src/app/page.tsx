import {
  ArrowRight,
  BellRing,
  Bot,
  Check,
  CircleDollarSign,
  Languages,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Workflow,
} from "lucide-react";

import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { InteractiveConciergeChat } from "@/components/mockups/InteractiveConciergeChat";
import { InteractiveHeroGuestPortal } from "@/components/mockups/InteractiveHeroGuestPortal";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ProductSchema } from "@/components/seo/SchemaInjector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TypewriterText } from "@/components/ui/TypewriterText";

const CAPABILITIES = [
  { icon: Languages, label: "50+ languages" },
  { icon: UserRoundCheck, label: "Human handoff" },
  { icon: ListChecks, label: "Trackable tasks" },
  { icon: ShieldCheck, label: "Hotel-controlled workflows" },
];

const REQUEST_FLOW = [
  {
    icon: MessageSquareText,
    step: "01",
    title: "A guest asks",
    text: "Chat, voice, or a QR code — without downloading an app.",
  },
  {
    icon: Bot,
    step: "02",
    title: "Butler AI routes",
    text: "Intent becomes a clear task for the right hotel team.",
  },
  {
    icon: BellRing,
    step: "03",
    title: "Staff completes",
    text: "The guest gets an update and managers keep visibility.",
  },
];

export default function Home() {
  return (
    <>
      <ProductSchema
        name="SOYL Cloud"
        description="AI hotel operations software that turns guest requests into coordinated work and helps hotel teams operate with less friction."
        category="BusinessSoftware"
      />

      <section className="relative min-h-[820px] overflow-hidden bg-[#07110f] pb-16 pt-28 text-white md:pb-20 md:pt-36 lg:min-h-[880px]">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/hero_lobby.png"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,12,11,.94)_0%,rgba(4,12,11,.82)_43%,rgba(4,12,11,.38)_72%,rgba(4,12,11,.62)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,7,.45)_0%,transparent_38%,rgba(2,8,7,.88)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_36%,rgba(109,186,178,.25),transparent_30%)]" />

        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-12">
            <div className="max-w-3xl py-8 lg:py-16">
              <Badge className="mb-7 border-white/15 bg-white/8 text-soyl-mint shadow-none" dot>
                AI operations for hotels
              </Badge>
              <h1 className="text-balance text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
                The hotel defines the destination.
                <span className="mt-3 block min-h-[2.05em] text-soyl-mint sm:min-h-[1.95em]">
                  Our AI{" "}
                  <TypewriterText
                    phrases={[
                      "answers every guest.",
                      "routes every request.",
                      "keeps every team in sync.",
                    ]}
                  />
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-white/70 md:text-xl">
                SOYL turns guest conversations into assigned, trackable work — so your hotel responds faster without adding another app for guests.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  href="/book-demo"
                  size="lg"
                  variant="secondary"
                  className="group border border-soyl-mint/60 px-7"
                >
                  See it with your hotel
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Button>
                <Button
                  href="/products/butler-ai"
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  Explore Butler AI
                </Button>
              </div>
              <p className="mt-5 text-sm text-white/45">
                Built for independent hotels, resorts, and growing groups.
              </p>
            </div>

            <div className="relative mx-auto flex min-h-[600px] w-full max-w-[560px] items-center justify-center" aria-label="Interactive preview of the Butler AI guest experience">
              <div className="absolute left-1/2 top-1/2 h-[520px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-soyl-mint/20 blur-[90px]" />
              <div className="absolute -left-4 top-20 hidden rounded-2xl border border-white/15 bg-black/30 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Guest access</p>
                <p className="mt-1 text-sm font-semibold text-white">Scan. No app.</p>
              </div>
              <div className="absolute bottom-24 right-0 z-20 hidden rounded-2xl border border-emerald-300/20 bg-[#0c1916]/80 px-4 py-3 shadow-xl backdrop-blur-xl sm:block">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                  <Check className="h-4 w-4" aria-hidden /> Request routed
                </p>
                <p className="mt-1 text-xs text-white/45">Housekeeping · Room 104</p>
              </div>
              <div className="relative z-10 w-[248px] sm:w-[276px] lg:w-[292px]">
                <PhoneMockup className="!w-full !rounded-[38px] !border-[9px]" priority>
                  <InteractiveHeroGuestPortal />
                </PhoneMockup>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-slate-200 bg-white py-6">
        <Container>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4" aria-label="Butler AI capabilities">
            {CAPABILITIES.map((item) => (
              <li key={item.label} className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
                <item.icon className="h-4 w-4 text-soyl-mint-dark" strokeWidth={1.8} aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-[var(--color-soyl-gray-50)] py-20 md:py-28">
        <Container>
          <SectionHeader
            badge="From request to resolution"
            title="One simple flow. No lost handoffs."
            description="Guests get a fast answer. Staff get a clear task. Managers can see what happened."
            className="mb-12"
          />
          <RevealGroup className="grid gap-4 md:grid-cols-3">
            {REQUEST_FLOW.map((item) => (
              <article key={item.title} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <span className="absolute right-6 top-5 text-5xl font-bold tracking-tighter text-slate-100">{item.step}</span>
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-soyl-mint-light text-soyl-mint-dark">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="relative mt-7 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="relative mt-2 max-w-xs text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section id="products" className="overflow-hidden bg-white py-20 md:py-28">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div className="relative isolate order-2 min-h-[620px] lg:order-1">
              <div className="absolute left-0 right-8 top-12 z-0 sm:right-20 sm:top-16">
                <BrowserMockup
                  src="/images/products_pics/Butler AI new OPs console .png"
                  alt="Butler AI operations console showing guest requests, tasks, and escalations"
                  glow
                />
              </div>
              <div className="absolute bottom-0 right-0 z-20 w-[210px] drop-shadow-[0_28px_38px_rgba(15,23,42,.2)] sm:w-[240px]">
                <PhoneMockup className="!w-full !rounded-[32px] !border-[8px]">
                  <InteractiveConciergeChat />
                </PhoneMockup>
              </div>
            </div>

            <Reveal className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-6">Butler AI · Available now</Badge>
              <h2 className="text-balance text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-5xl">
                A concierge for guests. An operations queue for staff.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Butler AI answers routine questions, captures service requests, and routes the work to the right team — while keeping a human close when judgment is needed.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "No guest app or login",
                  "Voice and chat in 50+ languages",
                  "Automatic routing with human escalation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-soyl-mint-light text-soyl-mint-dark"><Check className="h-3.5 w-3.5" aria-hidden /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <Button href="/products/butler-ai" size="lg" className="group mt-9">
                See Butler AI
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Button>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-[#0b121a] py-20 text-white md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(59,130,246,.16),transparent_35%)]" />
        <Container className="relative">
          <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal>
              <Badge className="mb-6 border-blue-300/20 bg-blue-300/10 text-blue-200 shadow-none">ARIP · Pilot program</Badge>
              <h2 className="text-balance text-4xl font-bold tracking-[-0.035em] text-white md:text-5xl">
                Your commercial systems should work as one team.
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/60">
                ARIP is the next SOYL layer: specialized agents coordinating pricing, campaigns, distribution, and guest revenue within rules your team sets.
              </p>
              <Button href="/products/arip" size="lg" variant="outline" className="group mt-9 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                Explore the ARIP vision
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Button>
            </Reveal>

            <Reveal className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Commercial orchestration</p>
                  <p className="mt-1 text-xs text-white/40">Illustrative workflow</p>
                </div>
                <Workflow className="h-5 w-5 text-blue-300" aria-hidden />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="space-y-3">
                  {[
                    [CircleDollarSign, "Pricing signals"],
                    [MessageSquareText, "Guest intent"],
                    [Sparkles, "Campaign performance"],
                  ].map(([Icon, label]) => {
                    const AgentIcon = Icon as typeof CircleDollarSign;
                    return (
                      <div key={label as string} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-medium text-white/70">
                        <AgentIcon className="h-4 w-4 text-blue-300" aria-hidden /> {label as string}
                      </div>
                    );
                  })}
                </div>
                <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-blue-300 sm:rotate-0" aria-hidden />
                <div className="rounded-2xl border border-soyl-mint/25 bg-soyl-mint/10 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-soyl-mint/15 text-soyl-mint"><Bot className="h-5 w-5" aria-hidden /></div>
                  <p className="mt-5 font-semibold text-white">ARIP orchestrator</p>
                  <p className="mt-2 text-sm leading-6 text-white/50">Coordinates specialist agents, checks operating rules, and keeps a reviewable decision record.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <FinalCTA
        eyebrow="Start with one guest workflow"
        title="Make service feel instant — without making operations invisible."
        description="See how Butler AI would handle the requests your front desk receives every day."
        secondaryLabel="Try the free Hotel Advisor"
        secondaryHref="/advisor"
      />
    </>
  );
}
