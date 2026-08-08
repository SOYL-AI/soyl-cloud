import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CircleDollarSign,
  FileSearch,
  Gauge,
  Globe2,
  Megaphone,
  MessageSquareText,
  Network,
  ScanSearch,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";

import { FinalCTA } from "@/components/sections/FinalCTA";
import { ProductSchema } from "@/components/seo/SchemaInjector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const AGENTS = [
  {
    icon: Gauge,
    title: "Revenue & pricing",
    text: "Monitors demand signals and proposes rate actions within your rules.",
    accent: "bg-emerald-400/10 text-emerald-300 border-emerald-300/15",
  },
  {
    icon: Megaphone,
    title: "Performance media",
    text: "Coordinates campaign budgets, audiences, and creative tests.",
    accent: "bg-blue-400/10 text-blue-300 border-blue-300/15",
  },
  {
    icon: ScanSearch,
    title: "Organic growth",
    text: "Finds high-intent search gaps and turns them into reviewable content briefs.",
    accent: "bg-violet-400/10 text-violet-300 border-violet-300/15",
  },
  {
    icon: Globe2,
    title: "Distribution",
    text: "Watches channel consistency, availability, and rate parity signals.",
    accent: "bg-amber-400/10 text-amber-300 border-amber-300/15",
  },
  {
    icon: MessageSquareText,
    title: "Guest intent",
    text: "Turns guest conversations into useful commercial and service context.",
    accent: "bg-cyan-400/10 text-cyan-300 border-cyan-300/15",
  },
  {
    icon: ShoppingBag,
    title: "Ancillary revenue",
    text: "Matches relevant upgrades and hotel services to the right moment.",
    accent: "bg-pink-400/10 text-pink-300 border-pink-300/15",
  },
];

const FLOW = [
  { number: "01", title: "Observe", text: "Collect approved commercial and guest signals.", icon: BarChart3 },
  { number: "02", title: "Coordinate", text: "Share context across specialist agents.", icon: Network },
  { number: "03", title: "Check", text: "Apply hotel rules, limits, and approvals.", icon: ShieldCheck },
  { number: "04", title: "Act & explain", text: "Execute approved work with a reviewable record.", icon: FileSearch },
];

export default function AripPage() {
  return (
    <>
      <ProductSchema
        name="ARIP"
        description="A pilot-stage orchestration platform for specialized hotel commercial agents, designed to coordinate pricing, marketing, distribution, and guest revenue within hotel-defined controls."
      />

      <main className="flex-1 bg-[#09100f] text-white">
        <section className="relative overflow-hidden border-b border-white/10 pb-20 pt-32 md:pb-28 md:pt-40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(59,130,246,.2),transparent_29%),radial-gradient(circle_at_18%_78%,rgba(109,186,178,.14),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:52px_52px]" />

          <Container className="relative">
            <div className="grid items-center gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
              <div className="max-w-2xl">
                <Badge className="mb-7 border-blue-300/20 bg-blue-300/10 text-blue-200 shadow-none">ARIP · Pilot program</Badge>
                <h1 className="text-balance text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
                  Your commercial team, working as one system.
                </h1>
                <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-white/65 md:text-xl">
                  ARIP coordinates specialist AI agents across pricing, marketing, distribution, and guest revenue — with the controls and visibility hotel teams need.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button href="/contact" size="lg" variant="secondary" className="group border border-soyl-mint/60 px-7">
                    Join ARIP pilot
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Button>
                  <Button href="#how-it-works" size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    View workflow
                  </Button>
                </div>
                <p className="mt-5 text-sm text-white/40">ARIP is in development. Pilot workflows are shaped with participating hotels.</p>
              </div>

              <div className="relative mx-auto w-full max-w-2xl" aria-label="ARIP coordinating hotel data, specialist agents, and governed actions">
                <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-400/10 blur-3xl" />
                <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                  <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
                    <div><p className="text-sm font-semibold text-white">ARIP orchestration map</p><p className="mt-1 text-xs text-white/40">Illustrative pilot workflow</p></div>
                    <Network className="h-5 w-5 text-blue-300" aria-hidden />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_1.2fr_auto_1fr] sm:items-center">
                    <div className="space-y-2.5">
                      {["Demand", "Guest intent", "Performance"].map((item, index) => {
                        const icons = [BarChart3, MessageSquareText, CircleDollarSign];
                        const Icon = icons[index];
                        return (
                          <div key={item} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs font-semibold text-white/65">
                            <Icon className="h-4 w-4 text-blue-300" aria-hidden /> {item}
                          </div>
                        );
                      })}
                    </div>
                    <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-blue-300 sm:rotate-0" aria-hidden />
                    <div className="rounded-2xl border border-soyl-mint/25 bg-soyl-mint/10 p-5 text-center">
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-soyl-mint/15 text-soyl-mint"><Bot className="h-6 w-6" aria-hidden /></span>
                      <p className="mt-4 text-sm font-bold text-white">ARIP orchestrator</p>
                      <p className="mt-1.5 text-xs leading-5 text-white/45">Shared context · policy checks · decision record</p>
                    </div>
                    <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-soyl-mint sm:rotate-0" aria-hidden />
                    <div className="space-y-2.5">
                      {["Rate action", "Campaign brief", "Guest offer"].map((item) => (
                        <div key={item} className="flex items-center gap-2.5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3 text-xs font-semibold text-emerald-100/75">
                          <Check className="h-4 w-4 text-emerald-300" aria-hidden /> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-white/10 bg-[#0c1514] py-7">
          <Container>
            <div className="grid gap-5 text-center sm:grid-cols-3">
              {[
                [SlidersHorizontal, "Hotel-defined controls"],
                [Network, "Shared agent context"],
                [FileSearch, "Reviewable decisions"],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof SlidersHorizontal;
                return (
                  <div key={label as string} className="flex items-center justify-center gap-2 text-sm font-semibold text-white/60">
                    <ItemIcon className="h-4 w-4 text-soyl-mint" aria-hidden /> {label as string}
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-[#f5f7f7] py-20 text-slate-950 md:py-28">
          <Container>
            <SectionHeader
              badge="The operating loop"
              title="From signal to governed action."
              description="ARIP is designed to coordinate work without hiding how a decision was reached."
              className="mb-12"
            />
            <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {FLOW.map((item) => (
                <article key={item.title} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,.05)]">
                  <span className="absolute right-6 top-5 text-5xl font-bold tracking-tighter text-slate-100">{item.number}</span>
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><item.icon className="h-5 w-5" aria-hidden /></div>
                  <h3 className="relative mt-7 text-lg font-bold text-slate-950">{item.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </article>
              ))}
            </RevealGroup>
          </Container>
        </section>

        <section className="border-y border-white/10 bg-[#09100f] py-20 md:py-28">
          <Container>
            <div className="mb-12 max-w-3xl">
              <Reveal>
                <Badge className="mb-6 border-white/15 bg-white/5 text-white/70 shadow-none">Specialist agents</Badge>
                <h2 className="text-balance text-4xl font-bold tracking-[-0.035em] text-white md:text-5xl">Six roles. One shared operating context.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/55">Each agent has a focused job. The orchestrator connects their work so one decision does not undermine another.</p>
              </Reveal>
            </div>
            <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {AGENTS.map((agent) => (
                <article key={agent.title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-7 transition-[background-color,border-color,transform] duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${agent.accent}`}><agent.icon className="h-5 w-5" aria-hidden /></div>
                  <h3 className="mt-6 text-lg font-bold text-white">{agent.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{agent.text}</p>
                </article>
              ))}
            </RevealGroup>
          </Container>
        </section>

        <section className="bg-white py-20 text-slate-950 md:py-28">
          <Container>
            <div className="grid items-center gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
              <Reveal>
                <Badge variant="secondary" className="mb-6">Control layer</Badge>
                <h2 className="text-balance text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-5xl">Automation should be inspectable.</h2>
                <p className="mt-6 text-lg leading-8 text-slate-600">ARIP is being designed around bounded actions: the hotel defines limits, teams choose approval levels, and every material action leaves a readable record.</p>
                <ul className="mt-8 space-y-4">
                  {["Policy checks before action", "Approval gates for sensitive changes", "Evidence and outcome recorded together"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><Check className="h-4 w-4 text-soyl-mint-dark" aria-hidden /> {item}</li>
                  ))}
                </ul>
              </Reveal>

              <Reveal className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#0a1110] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex gap-2" aria-hidden><span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" /></div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Illustrative decision record</p>
                  <ShieldCheck className="h-4 w-4 text-soyl-mint" aria-hidden />
                </div>
                <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-3">
                    {["Demand signal detected", "Pricing agent proposes change", "Hotel policy is checked", "Approval required"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3">
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${index < 3 ? "bg-emerald-300/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`}>{index < 3 ? "✓" : "!"}</span>
                        <span className="text-xs font-medium text-white/60">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-soyl-mint/20 bg-soyl-mint/[0.07] p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-soyl-mint">Proposed action</p>
                    <p className="mt-4 text-lg font-bold text-white">Review a rate adjustment for high-demand dates</p>
                    <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-white/45">
                      <div className="flex justify-between gap-4"><span>Evidence</span><span className="text-right text-white/70">Demand + availability signals</span></div>
                      <div className="flex justify-between gap-4"><span>Policy</span><span className="text-right text-white/70">Within configured rate band</span></div>
                      <div className="flex justify-between gap-4"><span>Next step</span><span className="text-right font-semibold text-amber-200">Manager approval</span></div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <FinalCTA
          eyebrow="Help shape the pilot"
          title="Build an AI commercial workflow around your hotel’s real constraints."
          description="We’re speaking with hotel operators about the decisions they would automate, review, or keep fully human."
          primaryLabel="Talk to the ARIP team"
          primaryHref="/contact"
          secondaryLabel="See Butler AI today"
          secondaryHref="/products/butler-ai"
        />
      </main>
    </>
  );
}
