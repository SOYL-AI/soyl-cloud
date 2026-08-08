import Image from "next/image";
import {
  ArrowRight,
  BellRing,
  Check,
  CircleCheckBig,
  Globe2,
  Headphones,
  ListChecks,
  MessageSquareText,
  Mic,
  QrCode,
  Route,
  ShieldAlert,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { FAQSchema, ProductSchema } from "@/components/seo/SchemaInjector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

const CAPABILITIES = [
  { icon: QrCode, label: "No app download" },
  { icon: Globe2, label: "50+ languages" },
  { icon: Route, label: "Automatic routing" },
  { icon: Headphones, label: "Human handoff" },
];

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Voice and chat",
    text: "Guests ask naturally instead of learning a new interface.",
  },
  {
    icon: Route,
    title: "Department routing",
    text: "Each request reaches housekeeping, F&B, or the front desk with context.",
  },
  {
    icon: UtensilsCrossed,
    title: "Room service",
    text: "Menus, ordering, and kitchen handoff live in the same guest journey.",
  },
  {
    icon: BellRing,
    title: "Visible task status",
    text: "Staff can claim work, update it, and see what still needs attention.",
  },
  {
    icon: ShieldAlert,
    title: "Escalations",
    text: "Sensitive or unusual requests move to a person instead of being guessed at.",
  },
  {
    icon: Mic,
    title: "Scheduled calls",
    text: "Support wake-up calls, confirmations, and stay check-ins from one console.",
  },
];

const FAQS = [
  {
    question: "Do guests need to download an app?",
    answer: "No. Guests open Butler AI from a QR code or web link on their own phone.",
  },
  {
    question: "What happens when Butler AI cannot handle a request?",
    answer: "The conversation can be handed to hotel staff with the request context preserved, so a person can take over without making the guest repeat themselves.",
  },
  {
    question: "Can staff see and manage every request?",
    answer: "Yes. The operations console brings conversations, assigned tasks, and escalations into one queue for the hotel team.",
  },
];

export default function ButlerAIPage() {
  return (
    <div className="flex flex-col">
      <ProductSchema
        name="Butler AI"
        description="A multilingual hotel concierge that turns guest conversations into routed, trackable service tasks without requiring an app download."
        category="SoftwareApplication"
      />
      <FAQSchema faqs={FAQS} />

      <section className="relative overflow-hidden bg-[#f5f8f7] pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(109,186,178,.24),transparent_30%)]" />
        <Container className="relative">
          <div className="grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-7">Butler AI · Available now</Badge>
              <h1 className="text-balance text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
                Guest requests in. Completed tasks out.
              </h1>
              <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-slate-600 md:text-xl">
                Butler AI gives guests one simple concierge for questions, orders, and requests — then gives staff one clear queue to act on them.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="/book-demo" size="lg" className="group px-7">
                  Book a walkthrough
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Button>
                <Button href="#workflow" size="lg" variant="outline">
                  See the workflow
                </Button>
              </div>
              <p className="mt-5 text-sm text-slate-500">Works from a QR code or web link. No guest login required.</p>
            </div>

            <div className="relative min-h-[570px] sm:min-h-[650px]">
              <div className="absolute left-0 right-0 top-4 sm:right-10">
                <BrowserMockup
                  src="/images/products_pics/Butler AI new OPs console .png"
                  alt="Butler AI operations console showing guest requests, tasks, and escalations"
                  glow
                  priority
                />
              </div>
              <div className="absolute bottom-0 right-0 w-[210px] sm:w-[250px]">
                <PhoneMockup
                  src="/images/products_pics/COncierge chat asking something guest mode .png"
                  alt="A guest using Butler AI from their phone"
                  className="!w-full !rounded-[34px] !border-[8px]"
                  priority
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-slate-200 bg-white py-6">
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

      <section id="workflow" className="scroll-mt-24 bg-white py-20 md:py-28">
        <Container>
          <SectionHeader
            badge="One connected workflow"
            title="The guest sees service. Your team sees the work."
            description="Butler AI keeps both sides of every request connected from the first message to completion."
            className="mb-12"
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <Reveal className="rounded-[2rem] border border-soyl-mint/20 bg-soyl-mint-light/55 p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-soyl-mint-dark">Guest side</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">Ask, order, or request</h3>
                </div>
                <QrCode className="h-6 w-6 text-soyl-mint-dark" aria-hidden />
              </div>
              <div className="mt-8 rounded-3xl border border-white bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.08)]">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-soyl-mint-light text-soyl-mint-dark"><Sparkles className="h-4 w-4" aria-hidden /></span>
                  <div><p className="text-sm font-bold text-slate-900">Hotel concierge</p><p className="text-xs text-slate-500">Usually replies instantly</p></div>
                </div>
                <div className="mt-5 ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-slate-900 px-4 py-3 text-sm leading-6 text-white">Please send two towels to room 408.</div>
                <div className="mt-3 max-w-[88%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">Done — housekeeping has the request. We’ll update you here.</div>
              </div>
            </Reveal>

            <div className="hidden items-center justify-center text-soyl-mint-dark lg:flex"><ArrowRight className="h-7 w-7" aria-hidden /></div>

            <Reveal className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Staff side</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">Claim, act, complete</h3>
                </div>
                <ListChecks className="h-6 w-6 text-slate-700" aria-hidden />
              </div>
              <div className="mt-8 space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)]">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-slate-400"><span>Housekeeping queue</span><span>Room 408</span></div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-sm font-bold text-slate-900">Deliver 2 bath towels</p><p className="mt-1 text-xs text-slate-500">From Butler AI · Normal priority</p></div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-sm">Claimed</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CircleCheckBig className="h-4 w-4" aria-hidden /> Guest receives the completion update</div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-soyl-gray-50)] py-20 md:py-28">
        <Container>
          <SectionHeader
            badge="Core capabilities"
            title="Everything needed to move a request forward."
            description="A focused toolkit for guest communication and service coordination."
            className="mb-12"
          />
          <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="group rounded-3xl border border-slate-200 bg-white p-7 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-soyl-mint/50 hover:shadow-[0_18px_50px_rgba(15,23,42,.08)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-soyl-mint-light text-soyl-mint-dark">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
              </article>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section className="overflow-hidden bg-white py-20 md:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <Reveal>
              <Badge variant="outline" className="mb-6">Operations console</Badge>
              <h2 className="text-balance text-4xl font-bold tracking-[-0.035em] text-slate-950 md:text-5xl">No request disappears into a chat thread.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">Conversations, active tasks, and escalations stay visible in one operating view — so the next shift knows what the last one promised.</p>
              <ul className="mt-8 space-y-4">
                {["Shared queue for hotel teams", "Clear owners and task states", "Guest context kept with the request"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700"><Check className="h-4 w-4 text-soyl-mint-dark" aria-hidden /> {item}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="relative">
              <div className="absolute -inset-8 rounded-full bg-soyl-mint/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-2xl sm:p-5">
                <Image
                  src="/images/products_pics/Showing created tasks .png"
                  alt="Butler AI task list with assigned guest requests"
                  width={1536}
                  height={1024}
                  className="h-auto w-full rounded-2xl border border-slate-200"
                  sizes="(max-width: 1024px) 100vw, 56vw"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-20 md:py-24">
        <Container size="md">
          <SectionHeader title="Questions hotel teams ask first" className="mb-10" />
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900 marker:content-none">
                  {faq.question}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="max-w-2xl pt-4 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <FinalCTA
        eyebrow="Bring us your busiest request type"
        title="See Butler AI handle it from first message to finished task."
        description="We’ll map the guest experience, the staff handoff, and the controls your hotel needs."
        primaryLabel="Book a Butler AI walkthrough"
      />
    </div>
  );
}
