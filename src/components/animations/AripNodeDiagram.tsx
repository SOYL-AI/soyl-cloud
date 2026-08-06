"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Search,
  Globe,
  ShoppingCart,
  Sparkles,
  Bot,
  Layers,
  Send,
  Zap,
} from "lucide-react";

/* ─── Make/n8n Brand Node Definition ─── */
export interface FlowNode {
  id: string;
  name: string;
  subtext: string;
  iconBg: string;
  iconColor: string;
  brandType: "openai" | "pms" | "whatsapp" | "google_ads" | "siteminder" | "router" | "stripe" | "bot";
}

export interface PresetPipeline {
  id: string;
  agentName: string;
  description: string;
  themeColor: string;
  nodes: FlowNode[];
}

const N8N_PIPELINES: PresetPipeline[] = [
  {
    id: "revenue",
    agentName: "Revenue & Pricing Pipeline",
    description: "Autonomously detects market price drops & adjusts live BAR rates in PMS & OTAs",
    themeColor: "#10B981",
    nodes: [
      { id: "1", name: "Market Trigger", subtext: "Watch Competitor Rates", iconBg: "#8B5CF6", iconColor: "#FFFFFF", brandType: "bot" },
      { id: "2", name: "OpenAI GPT-4o", subtext: "Analyze Rate Elasticity", iconBg: "#10A37F", iconColor: "#FFFFFF", brandType: "openai" },
      { id: "3", name: "ARIP Solver Hub", subtext: "Calculate BAR +14%", iconBg: "#3B82F6", iconColor: "#FFFFFF", brandType: "router" },
      { id: "4", name: "Opera / PMS Sync", subtext: "Update Room Inventory", iconBg: "#059669", iconColor: "#FFFFFF", brandType: "pms" },
      { id: "5", name: "SiteMinder OTA", subtext: "Sync Booking & Expedia", iconBg: "#2563EB", iconColor: "#FFFFFF", brandType: "siteminder" },
    ],
  },
  {
    id: "butler",
    agentName: "Butler AI Concierge Pipeline",
    description: "Processes guest WhatsApp messages, parses intent, and dispatches housekeeping tickets",
    themeColor: "#F59E0B",
    nodes: [
      { id: "1", name: "WhatsApp Inbound", subtext: "Guest Message Received", iconBg: "#25D366", iconColor: "#FFFFFF", brandType: "whatsapp" },
      { id: "2", name: "OpenAI NLU", subtext: "Parse Intent & Room #", iconBg: "#10A37F", iconColor: "#FFFFFF", brandType: "openai" },
      { id: "3", name: "ARIP Dispatcher", subtext: "Route to Housekeeping", iconBg: "#3B82F6", iconColor: "#FFFFFF", brandType: "router" },
      { id: "4", name: "PMS Service Log", subtext: "Create Ticket #402", iconBg: "#059669", iconColor: "#FFFFFF", brandType: "pms" },
      { id: "5", name: "WhatsApp Staff", subtext: "Notify Duty Manager", iconBg: "#25D366", iconColor: "#FFFFFF", brandType: "whatsapp" },
    ],
  },
  {
    id: "ads",
    agentName: "Google Ads ROAS Pipeline",
    description: "Reallocates ad spend to high-converting hotel search queries automatically",
    themeColor: "#3B82F6",
    nodes: [
      { id: "1", name: "Google Search API", subtext: "High Intent Query Spike", iconBg: "#4285F4", iconColor: "#FFFFFF", brandType: "google_ads" },
      { id: "2", name: "OpenAI Copywriter", subtext: "Generate Dynamic Ad Copy", iconBg: "#10A37F", iconColor: "#FFFFFF", brandType: "openai" },
      { id: "3", name: "ROAS Bidding Solver", subtext: "Adjust CPC Bid +18%", iconBg: "#8B5CF6", iconColor: "#FFFFFF", brandType: "router" },
      { id: "4", name: "Google Ads API", subtext: "Commit Live Campaign", iconBg: "#EA4335", iconColor: "#FFFFFF", brandType: "google_ads" },
    ],
  },
  {
    id: "upsell",
    agentName: "Upsell & Revenue Pipeline",
    description: "Offers tailored suite upgrades to guests 24 hours prior to arrival",
    themeColor: "#14B8A6",
    nodes: [
      { id: "1", name: "PMS Booking Event", subtext: "Check-in T-24 Hours", iconBg: "#059669", iconColor: "#FFFFFF", brandType: "pms" },
      { id: "2", name: "OpenAI Persona Match", subtext: "Match Suite Upgrade Offer", iconBg: "#10A37F", iconColor: "#FFFFFF", brandType: "openai" },
      { id: "3", name: "Stripe Checkout", subtext: "Generate 1-Click Upgrade", iconBg: "#6366F1", iconColor: "#FFFFFF", brandType: "stripe" },
      { id: "4", name: "WhatsApp Direct", subtext: "Deliver Upgrade Voucher", iconBg: "#25D366", iconColor: "#FFFFFF", brandType: "whatsapp" },
    ],
  },
];

/* ─── Brand Icon Component ─── */
function BrandNodeIcon({ type }: { type: FlowNode["brandType"] }) {
  if (type === "openai") {
    return (
      <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
        <path d="M22.28 9.87a5.98 5.98 0 0 0-.52-4.9 6 6 0 0 0-6.62-2.85A6 6 0 0 0 10.3 0a6 6 0 0 0-5.7 4.14 6 6 0 0 0-4.1 2.92 6 6 0 0 0 .7 7.07 5.98 5.98 0 0 0 .52 4.9 6 6 0 0 0 6.63 2.85A6 6 0 0 0 13.7 24a6 6 0 0 0 5.7-4.14 6 6 0 0 0 4.1-2.92 6 6 0 0 0-.7-7.07Zm-9.37 12.35a4.24 4.24 0 0 1-2.93-1.18l.15-.08 3.53-2.04a.88.88 0 0 0 .44-.76v-4.97l1.7 1v4.1a4.27 4.27 0 0 1-2.89 2.93ZM4.05 18.06a4.24 4.24 0 0 1-.55-3.11l.15.09 3.53 2.04a.88.88 0 0 0 .88 0l4.3-2.49v2l-3.55 2.05a4.27 4.27 0 0 1-4.76-.58ZM2.56 9.88a4.24 4.24 0 0 1 2.38-1.94v4.33a.88.88 0 0 0 .44.76l4.3 2.48-1.7.98-3.53-2.04a4.27 4.27 0 0 1-1.89-4.51Zm15.42 2.3-4.3-2.48 1.7-.98 3.53 2.04a4.27 4.27 0 0 1-.77 7.55v-4.33a.88.88 0 0 0-.44-.76Zm1.97-4.12a4.24 4.24 0 0 1 .55 3.11l-.15-.09-3.53-2.04a.88.88 0 0 0-.88 0l-4.3 2.49v-2l3.55-2.05a4.27 4.27 0 0 1 4.76.58ZM12 13.74l-2.15-1.24 2.15-1.24 2.15 1.24L12 13.74Z" />
      </svg>
    );
  }
  if (type === "whatsapp") {
    return <Send className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (type === "google_ads") {
    return <Search className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (type === "pms") {
    return <Layers className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (type === "siteminder") {
    return <Globe className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (type === "stripe") {
    return <ShoppingCart className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (type === "router") {
    return <Zap className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  return <Bot className="w-6 h-6 text-white stroke-[2.5]" />;
}

export function AripNodeDiagram() {
  const [activePipeline, setActivePipeline] = useState<PresetPipeline>(N8N_PIPELINES[0]);
  const [activeNodeId, setActiveNodeId] = useState<string>("1");

  return (
    <div className="w-full bg-[#F8FAFC] rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden text-slate-900 relative">
      {/* CANVAS TOP CONTROL BAR */}
      <div className="p-4 md:p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F5F3] border border-[#6DBAB2]/40 flex items-center justify-center text-[#3D8F87] shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-base text-slate-900 flex items-center gap-2">
              ARIP Automated Node Pipeline
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                Live Executing
              </span>
            </div>
            <p className="text-xs text-slate-500">{activePipeline.description}</p>
          </div>
        </div>

        {/* PIPELINE PRESET SELECTOR TABS */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
          {N8N_PIPELINES.map((pipeline) => {
            const isSelected = activePipeline.id === pipeline.id;
            return (
              <button
                key={pipeline.id}
                onClick={() => {
                  setActivePipeline(pipeline);
                  setActiveNodeId("1");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-md border border-slate-200/80 scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pipeline.themeColor }} />
                {pipeline.agentName.split(" ")[0]} Flow
              </button>
            );
          })}
        </div>
      </div>

      {/* MAKE.COM / N8N LIGHT CANVAS AREA */}
      <div className="relative min-h-[420px] p-6 md:p-12 flex flex-col items-center justify-center bg-[#F8FAFC] overflow-x-auto">
        {/* Make.com Dot Grid Pattern */}
        <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-60">
          <defs>
            <pattern id="n8n-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1.5" fill="#CBD5E1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#n8n-dot-grid)" />
        </svg>

        {/* CANVAS WORKFLOW PIPELINE NODE TRACK */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePipeline.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-8 md:gap-14 relative z-10 py-8 px-4 min-w-max"
          >
            {activePipeline.nodes.map((node, index) => {
              const isActive = activeNodeId === node.id;
              const isLast = index === activePipeline.nodes.length - 1;

              return (
                <div key={node.id} className="flex items-center gap-8 md:gap-14 relative">
                  {/* NODE CARD CONTAINER */}
                  <div
                    onClick={() => setActiveNodeId(node.id)}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    {/* Make.com Circular Brand Badge */}
                    <motion.div
                      whileHover={{ scale: 1.12 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isActive ? "ring-4 ring-offset-4 ring-[#6DBAB2]" : ""
                      }`}
                      style={{
                        backgroundColor: node.iconBg,
                        boxShadow: isActive ? `0 10px 25px ${node.iconBg}50` : "0 8px 20px rgba(0,0,0,0.1)",
                      }}
                    >
                      {/* Left Input Handle Dot */}
                      <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-300 absolute -left-1.5 top-1/2 -translate-y-1/2 shadow-sm" />

                      {/* Brand Icon */}
                      <BrandNodeIcon type={node.brandType} />

                      {/* Right Output Handle Dot */}
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute -right-1.5 top-1/2 -translate-y-1/2 shadow-sm" />
                    </motion.div>

                    {/* NODE TEXT LABELS BELOW CIRCLE */}
                    <div className="mt-3 text-center max-w-[130px]">
                      <h4 className="font-bold text-xs md:text-sm text-slate-900 group-hover:text-[#3D8F87] transition-colors">
                        {node.name}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                        {node.subtext}
                      </p>
                    </div>
                  </div>

                  {/* CONNECTING PULSE ANIMATED WIRE TO NEXT NODE */}
                  {!isLast && (
                    <div className="w-12 md:w-20 relative flex items-center justify-center">
                      {/* Connecting Line Track */}
                      <div className="w-full h-1 bg-slate-300/80 rounded-full relative overflow-hidden">
                        {/* Animated Glowing Packet Flow */}
                        <motion.div
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                          className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#6DBAB2] to-transparent"
                        />
                      </div>

                      {/* Dotted Pulsing Connector Overlay */}
                      <div className="absolute inset-0 flex items-center justify-between">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        <span className="w-2 h-2 rounded-full bg-[#6DBAB2] animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM ACTIVE NODE STATUS DETAILS BAR */}
        <div className="mt-8 bg-white border border-slate-200 shadow-md rounded-2xl p-4 max-w-2xl w-full flex items-center justify-between text-xs text-slate-700 z-10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-900">
              Active Node: {activePipeline.nodes.find((n) => n.id === activeNodeId)?.name || "Pipeline Running"}
            </span>
          </div>
          <div className="font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
            Status: 200 OK &bull; Executed in 18ms
          </div>
        </div>
      </div>
    </div>
  );
}
