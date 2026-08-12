"use client";

import { useRef, useState } from "react";
import {
  Bell,
  Sparkles,
  Mic,
  Shield,
  X,
  Send,
  CheckCircle2,
  Cpu,
  Moon,
  Globe,
  Utensils,
  BedDouble,
  PhoneCall,
  Shirt,
  Flame,
  Droplets,
  RotateCcw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  status?: string;
  modelBadge?: string;
}

export function InteractiveHeroGuestPortal() {
  const messageId = useRef(2);
  const [activeSheet, setActiveSheet] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "user",
      text: "Send extra towels please",
      timestamp: "10:14 AM",
    },
    {
      id: "m-2",
      sender: "bot",
      text: "Housekeeping ticket #104 logged. 2 luxury bath towels dispatched to Room 104 in ~4 mins.",
      timestamp: "10:14 AM",
      status: "Dispatched",
      modelBadge: "SOYL Model",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const nextMessageId = (prefix: "u" | "b") => {
    messageId.current += 1;
    return `${prefix}-${messageId.current}`;
  };

  const handleQuickAction = (actionTitle: string, defaultPrompt: string) => {
    setActiveSheet(true);

    const userMsg: ChatMessage = {
      id: nextMessageId("u"),
      sender: "user",
      text: defaultPrompt,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = "";
      if (actionTitle === "DND") {
        botResponse = "Do Not Disturb active for Room 104. Housekeeping & front-desk alerts paused until tomorrow morning.";
      } else if (actionTitle === "MAKE ROOM") {
        botResponse = "Make Up Room request logged. Housekeeping supervisor assigned for Room 104 priority cleaning.";
      } else if (actionTitle === "WATER BOTTLE") {
        botResponse = "2 complimentary glass water bottles dispatched to Room 104 via staff runner.";
      } else if (actionTitle === "FRESH TOWELS") {
        botResponse = "Housekeeping ticket #104 dispatched. 2 bath towels & floor mat will arrive at Room 104 in 4 minutes.";
      } else {
        botResponse = `Butler AI received request ("${defaultPrompt}"). Department ticket dispatched to duty staff.`;
      }

      const botMsg: ChatMessage = {
        id: nextMessageId("b"),
        sender: "bot",
        text: botResponse,
        timestamp: "Just now",
        status: "Verified",
        modelBadge: "SOYL Model",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 550);
  };

  const handleSendCustom = async () => {
    if (!inputValue.trim()) return;

    const text = inputValue.trim();
    setInputValue("");

    const userMsg: ChatMessage = {
      id: nextMessageId("u"),
      sender: "user",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    let responseText = "";

    // Simulated local AI logic (no fetch to /api/advisor as it is B2B)
    const lower = text.toLowerCase();
    if (lower.includes("towel") || lower.includes("water") || lower.includes("clean")) {
      responseText = `Request logged ("${text}"). Housekeeping staff dispatched to Room 104.`;
    } else if (lower.includes("food") || lower.includes("menu") || lower.includes("dinner")) {
      responseText = `Room service request received ("${text}"). Please confirm your order details.`;
    } else {
      responseText = `Request logged ("${text}"). Butler AI verified intent & dispatched ticket to Room 104 staff.`;
    }

    if (!responseText) {
      responseText = `Request logged ("${text}"). Butler AI verified intent & dispatched ticket to Room 104 staff.`;
    }

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: nextMessageId("b"),
        sender: "bot",
        text: responseText,
        timestamp: "Just now",
        status: "Verified",
        modelBadge: "SOYL Model",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
  return (
    <div className="w-full h-full bg-[#FAFAFA] flex flex-col justify-between pt-7 pb-3 px-3.5 relative font-sans text-slate-800 select-none overflow-hidden">
      {/* 1. TOP HEADER BAR */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 block">
            GRANDPLAZA
          </span>
          <span className="text-[17px] font-black tracking-tight text-slate-900 leading-none">
            SOYL Concierge
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button aria-label="Change language" className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-[10px] font-bold">
            <Globe className="w-3 h-3" />
          </button>
          <button className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
            中国の
          </button>
          <button aria-label="Toggle dark mode" className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Moon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. GREETING & GUEST ROOM SECTION */}
      <div className="my-3 text-center z-10">
        <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 block">
          GOOD EVENING
        </span>
        <h3 className="font-serif text-2xl font-bold text-slate-900 italic tracking-tight my-0.5">
          Roy
        </h3>
        <span className="text-xs font-medium text-slate-500">Room 104</span>
      </div>

      {/* 3. QUICK ACTIONS GRID */}
      <div className="z-10 mt-3">
        <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-2 block">
          QUICK ACTIONS
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: "DND", label: "DND", icon: Bell, prompt: "Activate Do Not Disturb for Room 104" },
            { id: "MAKE ROOM", label: "MAKE ROOM", icon: RotateCcw, prompt: "Please send housekeeping to clean Room 104" },
            { id: "WATER BOTTLE", label: "WATER BOTTLE", icon: Droplets, prompt: "Send 2 water bottles to Room 104" },
            { id: "FRESH TOWELS", label: "FRESH TOWELS", icon: Sparkles, prompt: "Send extra fresh towels please" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleQuickAction(item.id, item.prompt)}
              className="bg-white border border-slate-200/90 rounded-2xl py-2 px-1 flex flex-col items-center justify-center gap-1 shadow-xs hover:border-[#6DBAB2] hover:shadow-md transition-all active:scale-95 group"
            >
              <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:text-[#3D8F87] group-hover:bg-[#E8F5F3]">
                <item.icon className="w-3 h-3" />
              </div>
              <span className="text-[8px] font-extrabold text-slate-600 leading-tight text-center group-hover:text-slate-900">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. HORIZONTAL SCROLL HELP */}
      <div className="z-10 mt-4 overflow-hidden -mx-4 px-4 pb-2">
        <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1.5 block">
          HOW CAN WE HELP?
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={() => handleQuickAction("Room Service", "I'd like to order Room Service dinner for Room 104")}
            style={{ backgroundImage: "url('/images/restaurant_digital.png')" }}
            className="h-24 cursor-pointer rounded-2xl bg-slate-900 bg-cover bg-center p-2.5 relative overflow-hidden text-white group shadow-sm flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />
            <Utensils className="w-4 h-4 text-amber-400 relative z-10 mb-1" />
            <h4 className="font-serif font-bold text-sm relative z-10 leading-none shadow-black/50 drop-shadow-md">Room Service</h4>
            <p className="text-[10px] text-slate-200 relative z-10 leading-tight mt-0.5">Order food & drinks</p>
          </div>
          <div
            onClick={() => handleQuickAction("Housekeeping", "Request extra housekeeping amenities for Room 104")}
            style={{ backgroundImage: "url('/images/industry_hotel.png')" }}
            className="h-24 cursor-pointer rounded-2xl bg-slate-800 bg-cover bg-center p-2.5 relative overflow-hidden text-white group shadow-sm flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />
            <BedDouble className="w-4 h-4 text-emerald-400 relative z-10 mb-1" />
            <h4 className="font-serif font-bold text-sm relative z-10 leading-none shadow-black/50 drop-shadow-md">Housekeeping</h4>
            <p className="text-[10px] text-slate-200 relative z-10 leading-tight mt-0.5">Towels & cleaning</p>
          </div>
          <div
            onClick={() => handleQuickAction("Front Desk", "I have a question for the Front Desk team")}
            style={{ backgroundImage: "url('/images/hero_lobby.png')" }}
            className="h-24 cursor-pointer rounded-2xl bg-slate-800 bg-cover bg-center p-2.5 relative overflow-hidden text-white group shadow-sm flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />
            <PhoneCall className="w-4 h-4 text-blue-400 relative z-10 mb-1" />
            <h4 className="font-serif font-bold text-sm relative z-10 leading-none shadow-black/50 drop-shadow-md">Front Desk</h4>
            <p className="text-[10px] text-slate-200 relative z-10 leading-tight mt-0.5">Questions & FAQs</p>
          </div>
          <div
            onClick={() => handleQuickAction("Laundry", "Schedule laundry pickup for Room 104")}
            style={{ backgroundImage: "url('/images/industry_resort.png')" }}
            className="h-24 cursor-pointer rounded-2xl bg-slate-900 bg-cover bg-center p-2.5 relative overflow-hidden text-white group shadow-sm flex flex-col justify-end"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-0" />
            <Shirt className="w-4 h-4 text-purple-400 relative z-10 mb-1" />
            <h4 className="font-serif font-bold text-sm relative z-10 leading-none shadow-black/50 drop-shadow-md">Laundry</h4>
            <p className="text-[10px] text-slate-200 relative z-10 leading-tight mt-0.5">Pickup & turnaround</p>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM CONCIERGE BAR & SOS */}
      <div className="z-10 mt-2 flex flex-col gap-1.5">
        <button
          onClick={() => {
            setActiveSheet(true);
          }}
          className="w-full bg-white rounded-full py-2.5 px-4 flex items-center justify-center gap-2 shadow-sm border border-[#3D8F87]/20 hover:bg-slate-50 transition-colors"
        >
          <Mic className="w-3.5 h-3.5 text-teal-700" />
          <span className="text-xs font-semibold text-teal-700">Talk to the concierge</span>
        </button>

        <div className="flex items-center justify-between gap-2">
          <button className="flex-1 bg-red-600 text-white rounded-full py-1.5 px-3 flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-wider shadow-sm">
            <Flame className="w-3 h-3 fill-white" />
            SOS EMERGENCY
          </button>
          <button className="bg-slate-100 text-slate-700 rounded-full py-1.5 px-3 flex items-center justify-center gap-1 text-[10px] font-bold">
            <Shield className="w-3 h-3" />
            SAFETY
          </button>
        </div>
      </div>

      {/* 6. INTERACTIVE BUTLER AI CONCIERGE LIVE CHAT OVERLAY SHEET */}
      {activeSheet && (
        <div className="absolute inset-0 bg-[#0A0D14]/60 backdrop-blur-xs z-30 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-[#F4F5F7] rounded-t-3xl p-3 border-t border-slate-200 shadow-2xl h-[92%] flex flex-col justify-between relative">
            {/* SHEET HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">Butler AI</h3>
                  <p className="text-[10px] font-medium text-slate-500">Concierge</p>
                </div>
              </div>

              <button
                aria-label="Close"
                onClick={() => setActiveSheet(false)}
                className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* MESSAGES SCROLL AREA */}
            <div className="flex-1 my-2 overflow-y-auto space-y-2 px-0.5 scrollbar-hide flex flex-col justify-end">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-xs ${
                      msg.sender === "user"
                        ? "bg-[#0A0D14] text-white rounded-br-none font-medium"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-none font-normal"
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                    {msg.modelBadge && (
                      <span className="text-[8px] font-bold text-[#3D8F87] bg-[#E8F5F3] px-1.5 py-0.5 rounded-full border border-[#6DBAB2]/30">
                        {msg.modelBadge}
                      </span>
                    )}
                    {msg.status && (
                      <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 inline" /> {msg.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-slate-200 text-xs text-slate-500 max-w-[100px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* INPUT FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputValue.trim()) {
                  handleQuickAction("CUSTOM", inputValue);
                  setInputValue("");
                }
              }}
              className="bg-white rounded-full border border-slate-200 p-1 flex items-center shadow-sm focus-within:border-slate-300 focus-within:shadow transition-all"
            >
              <div className="pl-2.5 pr-2">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Butler AI..."
                className="flex-1 bg-transparent px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                aria-label="Send message"
                type="submit"
                disabled={!inputValue.trim()}
                className="w-7 h-7 rounded-full bg-[#3D8F87] text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
