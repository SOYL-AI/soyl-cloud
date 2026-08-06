'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Search, FileText, Globe, MessageSquare, ShoppingCart, ShieldCheck, Terminal, ChevronRight, Activity, Zap } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Reveal, RevealGroup } from '@/components/ui/Reveal'
import { FinalCTA } from '@/components/sections/FinalCTA'
import { ProductSchema } from '@/components/seo/SchemaInjector'
import { AripNodeDiagram } from '@/components/animations/AripNodeDiagram'

const AGENTS = [
  {
    id: 'revenue',
    name: 'Revenue & Pricing Agent',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Executes continuous micro-optimizations across all channels based on multi-variate demand signals.',
    stat: '+$14.2K',
    statLabel: 'RevPAR Lift (30d)',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(52,211,153,0.15)]',
    log: `> [SYSTEM] Initializing Demand Scan
> Parsing 40+ regional signals...
> Flight arrivals +22% for next week
> Competitor A sold out base rooms
> Action: Adjusting BAR Rate Deluxe King +14% ($210 -> $239)
> Status: SUCCESS. Synchronizing across channels...`
  },
  {
    id: 'ads',
    name: 'Performance Media Agent',
    icon: <Search className="h-5 w-5" />,
    description: 'Dynamically shifts ad spend towards highest-converting clusters while pausing inefficient campaigns.',
    stat: '-28%',
    statLabel: 'CPA Reduction',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(96,165,250,0.15)]',
    log: `> [ADS_ENGINE] Analyzing keyword performance
> High intent detected: "luxury suites near downtown"
> ROAS dropping on generic terms...
> Action: Reallocating $500/day to high-intent cluster
> Status: Optimization deployed. ROAS tracking updated.`
  },
  {
    id: 'seo',
    name: 'Organic Growth Agent',
    icon: <FileText className="h-5 w-5" />,
    description: 'Parametrically generates localized landing pages and schema markup to capture long-tail search intent.',
    stat: '+340%',
    statLabel: 'Organic Traffic Lift',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(192,132,252,0.15)]',
    log: `> [CONTENT_GEN] Identifying search gaps
> Trend spotted: "Winter retreats with spa"
> Generating 1200-word semantic cluster...
> Compiling custom Schema.org structured data...
> Action: Publishing to /blog/winter-spa-retreat
> Status: Live and indexed via API.`
  },
  {
    id: 'ota',
    name: 'Distribution Agent',
    icon: <Globe className="h-5 w-5" />,
    description: 'Polices rate parity autonomously and manages ranking algorithms across major OTAs.',
    stat: '+18%',
    statLabel: 'OTA Visibility Score',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(251,146,60,0.15)]',
    log: `> [OTA_SYNC] Global parity check initiated
> Expedia rate: $239 | Booking.com rate: $245
> Violation detected: Margin compression risk
> Action: Harmonizing net rates across distribution matrix
> Status: Parity restored. Ranking algorithms satisfied.`
  },
  {
    id: 'butler',
    name: 'Intent Extraction Agent',
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Distills unstructured zero-party conversational data into structured operational triggers.',
    stat: '4.2K',
    statLabel: 'Context Nodes Mapped',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(34,211,238,0.15)]',
    log: `> [INTENT_EXTRACTOR] Parsing inbound comms
> Thread: "We are coming for our 10th anniversary."
> Extracted vectors: [Anniversary, VIP_Potential]
> Action: Appending to Unified Guest Profile
> Alerting Master Orchestrator for workflow trigger
> Status: Processed and queued.`
  },
  {
    id: 'upsell',
    name: 'Ancillary Revenue Agent',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Determines the optimal commercial offer and timing for each guest across their journey.',
    stat: '+$8.5K',
    statLabel: 'Ancillary Rev (30d)',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    borderColor: 'border-pink-500/30',
    glowColor: 'shadow-[0_0_30px_rgba(244,114,182,0.15)]',
    log: `> [UPSELL_ENGINE] Ingesting orchestrator context
> Guest Profile ID #8849: Anniversary, high-spend propensity
> Inventory check: Executive Suite (Available), Spa (2 slots)
> Action: Dispatching dynamic SMS offer (T-minus 24h)
> Status: Sent. Conversion webhook listening.`
  }
]

export default function AripPage() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0])
  
  // Terminal typing effect state
  const [displayedLog, setDisplayedLog] = useState('')
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayedLog('')
    let i = 0
    const text = activeAgent.log
    
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedLog(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(typingInterval)
      }
    }, 15) // Speed of typing
    
    return () => clearInterval(typingInterval)
  }, [activeAgent])

  return (
    <>
      <ProductSchema
        name="ARIP"
        description="An autonomous workforce of specialized AI agents engineered to optimize total revenue and fundamentally shift hospitality unit economics."
        image="/images/arip-orchestrator.jpg"
      />
      
      <main className="flex-1 bg-white">
        {/* HERO */}
        <section className="bg-[#0A0D14] relative pt-32 pb-24 overflow-hidden border-b border-white/5 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-soyl-mint/10 via-[#0A0D14] to-[#0A0D14]"></div>
          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="max-w-2xl">
                <Reveal>
                  <Badge variant="outline" className="mb-6 border-soyl-mint/30 text-soyl-mint bg-soyl-mint/5 backdrop-blur-sm">
                    <Activity className="w-3 h-3 mr-2 inline-block animate-pulse" />
                    ARIP Orchestrator is Live
                  </Badge>
                </Reveal>
                <Reveal delay={0.1}>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
                    Rewire your property&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-r from-soyl-mint to-blue-400">financial engine.</span>
                  </h1>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
                    ARIP is not just another Revenue Management System. It is an autonomous commercial workforce. Six specialized AI agents functioning cohesively to compress operational overhead and maximize RevPAR around the clock.
                  </p>
                </Reveal>
                <Reveal delay={0.3} className="flex flex-col sm:flex-row gap-4">
                  <Button href="/contact" size="lg" className="bg-white text-[#0A0D14] hover:bg-gray-100 rounded-full px-8 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    Schedule Technical Briefing
                  </Button>
                  <Button href="#architecture" variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5 rounded-full px-8 backdrop-blur-sm">
                    Explore Architecture
                  </Button>
                </Reveal>
              </div>
              
              <div className="relative w-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-soyl-mint/10 to-transparent rounded-full blur-3xl opacity-30"></div>
                <div className="w-full relative z-10">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl group border border-white/10 bg-[#0A0D14]/80 backdrop-blur-sm p-1">
                    <div className="absolute inset-0 bg-gradient-to-tr from-soyl-mint/20 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" />
                    <Image 
                      src="/images/arip-flow.jpg" 
                      alt="ARIP Agent Flow" 
                      width={1200} 
                      height={800} 
                      className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700 rounded-xl mix-blend-screen"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* FINANCIAL IMPACT / THE SHIFT */}
        <section className="py-24 bg-gray-50 border-b border-gray-200">
          <Container>
            <div className="max-w-4xl mx-auto text-center mb-16">
              <Reveal>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1A1F25] mb-6">
                  A systemic shift in hospitality unit economics.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-xl text-gray-600">
                  The legacy model relies on siloed tools and human bottlenecks. ARIP unifies demand generation, pricing logic, and digital operations into a single deterministic feedback loop, fundamentally altering the profit margins of your asset.
                </p>
              </Reveal>
            </div>
            
            <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Reveal delay={0.1}>
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-4xl font-bold text-[#1A1F25] mb-2">+12-18%</div>
                  <div className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Gross RevPAR Uplift</div>
                  <p className="text-gray-500 text-sm">Achieved through continuous micro-adjustments and algorithmic parity management across the distribution matrix.</p>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-4xl font-bold text-[#1A1F25] mb-2">-40%</div>
                  <div className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">CAC Reduction</div>
                  <p className="text-gray-500 text-sm">By dynamically shifting media spend and generating hyper-relevant organic entry vectors without agency overhead.</p>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-4xl font-bold text-[#1A1F25] mb-2">24/7/365</div>
                  <div className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Operational Velocity</div>
                  <p className="text-gray-500 text-sm">Decisions executed instantaneously based on live signals, completely eliminating the latency of human analysis.</p>
                </div>
              </Reveal>
            </RevealGroup>
          </Container>
        </section>

        {/* INTERACTIVE AGENT ARCHITECTURE */}
        <section id="architecture" className="py-24 bg-white overflow-hidden">
          <Container>
            <div className="mb-16">
              <Reveal>
                <Badge variant="secondary" className="mb-4 bg-gray-100 text-[#1A1F25] border-none">The Orchestrator Matrix</Badge>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="text-3xl md:text-5xl font-bold text-[#1A1F25] mb-4">
                  Six specialists. One unified brain.
                </h2>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-gray-600 text-lg max-w-2xl">
                  Explore how each specialized autonomous agent executes its domain logic while sharing contextual state through the central ARIP Orchestrator.
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Agent Selector */}
              <div className="lg:col-span-5 space-y-3">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setActiveAgent(agent)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 border flex items-center justify-between group ${
                      activeAgent.id === agent.id
                        ? 'bg-[#0A0D14] border-[#0A0D14] shadow-lg text-white'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-[#1A1F25]'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        activeAgent.id === agent.id ? agent.bgColor : 'bg-gray-100 text-gray-500 group-hover:text-gray-900'
                      } ${activeAgent.id === agent.id ? agent.color : ''}`}>
                        {agent.icon}
                      </div>
                      <span className="font-semibold">{agent.name}</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${activeAgent.id === agent.id ? 'text-white/50' : 'text-gray-400'}`} />
                  </button>
                ))}
              </div>

              {/* Right Column: Active Terminal View */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeAgent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col"
                  >
                    {/* Stat Card */}
                    <div className={`p-6 rounded-t-2xl border-x border-t bg-[#0A0D14] ${activeAgent.borderColor} ${activeAgent.glowColor} relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        {activeAgent.icon}
                      </div>
                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <div className={`text-sm font-mono mb-1 ${activeAgent.color}`}>{"//"} {activeAgent.id}_module.sys</div>
                          <h3 className="text-2xl font-bold text-white mb-2">{activeAgent.name}</h3>
                          <p className="text-gray-400 text-sm max-w-md">{activeAgent.description}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${activeAgent.color}`}>{activeAgent.stat}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider">{activeAgent.statLabel}</div>
                        </div>
                      </div>
                    </div>

                    {/* Terminal View */}
                    <div className={`flex-1 p-6 rounded-b-2xl bg-[#05070A] border-x border-b ${activeAgent.borderColor} font-mono text-sm relative`}>
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      <pre className={`whitespace-pre-wrap leading-relaxed ${activeAgent.color} opacity-90 drop-shadow-md`}>
                        {displayedLog}
                        <span className="animate-pulse inline-block w-2 h-4 bg-current ml-1 align-middle"></span>
                      </pre>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Container>
        </section>

        {/* XAI DECISION LOG SECTION */}
        <section className="py-32 bg-[#0A0D14] text-white relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <Reveal>
                  <Badge variant="outline" className="mb-6 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 backdrop-blur-md">
                    <ShieldCheck className="w-3 h-3 mr-2 inline" />
                    Explainable AI (XAI)
                  </Badge>
                </Reveal>
                <Reveal delay={0.1}>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Total autonomy. Zero black boxes.
                  </h2>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    Enterprise governance requires absolute transparency. Unlike legacy machine learning models, ARIP utilizes deterministic constraint solvers and human-readable Chain-of-Thought logs. Every action is cryptographically recorded, mathematically justified, and strictly bounded by your GM&apos;s predefined parameters.
                  </p>
                </Reveal>
                
                <RevealGroup className="space-y-6">
                  <Reveal delay={0.3}>
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mr-4 flex-shrink-0">
                        <Zap className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Deterministic Execution</h4>
                        <p className="text-gray-400 text-sm mt-1">Pricing vectors never hallucinate. Actions are bound by rigid mathematical constraints.</p>
                      </div>
                    </div>
                  </Reveal>
                  <Reveal delay={0.4}>
                    <div className="flex items-start">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mr-4 flex-shrink-0">
                        <Terminal className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Chain-of-Thought Audits</h4>
                        <p className="text-gray-400 text-sm mt-1">Instantly review the exact evidence and logic pathway that led to any commercial decision.</p>
                      </div>
                    </div>
                  </Reveal>
                </RevealGroup>
              </div>
              
              <Reveal delay={0.2}>
                {/* Premium Terminal UI */}
                <div className="relative rounded-2xl overflow-hidden bg-[#0A0D14] border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.15)] backdrop-blur-xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                  
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20 bg-white/[0.02]">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="text-xs font-mono text-emerald-500/70 tracking-widest uppercase">
                      Audit_Log.exe
                    </div>
                    <div className="w-14"></div> {/* Spacer for centering */}
                  </div>
                  
                  {/* Terminal Body */}
                  <div className="p-6 font-mono text-sm leading-relaxed text-emerald-400/90">
                    <pre className="whitespace-pre-wrap">
{`[ EXECUTING DECISION #ARIP-8841 ]
Timestamp: 2026-08-04 14:22:10 UTC
Target: Core Pricing Matrix

> Fetching constraint parameters... [OK]
> Analyzing multi-variate vectors:
  ├─ API_Flight: Regional arrivals +22% (T+1)
  ├─ API_CompSet: Competitor A base sold out
  └─ API_Weather: Forecast update (Rain → Sunny)

> Calculating probabilistic outcome...
  Expected RevPAR Delta: +$2,800
  Confidence Score: 94.2%

> Evaluating GM Policy Bounds:
  Max Rate Cap: $350 (PASS)
  Min Stay Req: None (PASS)

> ACTION COMMITTED:
  Update BAR Rate Deluxe King +14% ($210 → $239)
  
> Syncing via SiteMinder API... [200 OK]`}
                    </pre>
                  </div>
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* N8N BASED VISUAL BUILDER SECTION */}
        <section className="py-24 bg-[#0A0D14] border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-soyl-mint opacity-5 blur-[120px] rounded-full pointer-events-none" />
          <Container className="relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Reveal>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
                  Visual Logic Builder
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-lg text-gray-400">
                  Configure custom workflows and orchestrate agents with our powerful node-based editor. 
                  Connect your PMS, OTAs, and third-party tools seamlessly.
                </p>
              </Reveal>
            </div>
            
            <Reveal delay={0.2}>
              <div className="w-full max-w-5xl mx-auto">
                <AripNodeDiagram />
              </div>
            </Reveal>
          </Container>
        </section>

        <FinalCTA />
      </main>
    </>
  )
}
