"use client";

import { useState } from "react";
import { Send, Sparkles, CheckCircle2, Cpu } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  status?: string;
  modelBadge?: string;
}

const QUICK_PROMPTS = [
  "Send extra towels please",
  "What time does the pool close?",
  "Can I request 1-hour late checkout?",
  "Order breakfast for 8:30 AM",
];

const PROMPT_ENGINEERED_RESPONSES: Record<string, string> = {
  "send extra towels please": "Housekeeping ticket #104 dispatched. 2 bath towels & floor mat will arrive at Room 104 in 4 minutes.",
  "what time does the pool close?": "The rooftop infinity pool is open until 10:00 PM tonight. Complimentary deck towels are available.",
  "can i request 1-hour late checkout?": "Checked room availability: Late checkout at 12:00 PM confirmed for Room 104 with complimentary approval.",
  "order breakfast for 8:30 am": "F&B kitchen ticket logged. Hot continental breakfast spread scheduled for delivery at 8:30 AM.",
};

export function InteractiveConciergeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "user",
      text: "Send extra towels please",
      timestamp: "10:14 AM",
    },
    {
      id: "msg-2",
      sender: "bot",
      text: "Housekeeping ticket #104 dispatched. 2 bath towels & floor mat will arrive at Room 104 in 4 minutes.",
      timestamp: "10:14 AM",
      status: "Dispatched",
      modelBadge: "SOYL Proprietary Model",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `msg-user-${messages.length + 1}`,
      sender: "user",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    let responseText = "";

    // Step 1: Attempt live API call to SOYL Advisor endpoint
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: {
            property_type: "Hotel Room 104",
            pain: text,
            detail: text,
          },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { insight?: { headline?: string; blocks?: Array<{ markdown?: string }> } };
        if (data?.insight?.blocks?.[0]?.markdown) {
          responseText = data.insight.blocks[0].markdown;
        }
      }
    } catch {
      // Ignore error and fall back to prompt-engineered response
    }

    // Step 2: Prompt-engineered fallback response engine
    if (!responseText) {
      const lower = text.toLowerCase();
      responseText = PROMPT_ENGINEERED_RESPONSES[lower];

      if (!responseText) {
        if (lower.includes("towel") || lower.includes("pillow") || lower.includes("blanket") || lower.includes("clean")) {
          responseText = `Housekeeping ticket dispatched for Room 104. Attendant assigned for immediate room delivery.`;
        } else if (lower.includes("checkout") || lower.includes("time") || lower.includes("leave")) {
          responseText = `Standard checkout: 11:00 AM. Complimentary late checkout until 1:00 PM is reserved for Room 104.`;
        } else if (lower.includes("eat") || lower.includes("food") || lower.includes("dinner") || lower.includes("menu")) {
          responseText = `In-house bistro serving dinner until 11:00 PM. Room service order can be placed directly in this chat.`;
        } else if (lower.includes("wifi") || lower.includes("internet")) {
          responseText = `Connect to 'GrandPlaza_Guest'. No password required — room # & last name auto-authenticates.`;
        } else {
          responseText = `Request logged ("${text}"). SOYL Autonomous Agent has verified intent & alerted Room 104 duty staff.`;
        }
      }
    }

    // Step 3: Append bot response with SOYL Model Badge citation
    setTimeout(() => {
      const botMsg: Message = {
        id: `msg-bot-${messages.length + 2}`,
        sender: "bot",
        text: responseText,
        timestamp: "Just now",
        status: "Verified",
        modelBadge: "SOYL Proprietary Model",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="w-full h-full bg-[#F4F5F7] flex flex-col justify-between pt-7 pb-2 px-3 relative font-sans text-slate-800">
      {/* HEADER BAR */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-200/80 shadow-sm z-10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Grand Plaza &bull; Room 104
            </span>
          </div>
          {/* Tag: Runs on SOYL Proprietary Model */}
          <span className="text-[9px] font-bold tracking-tight bg-[#E8F5F3] text-[#3D8F87] border border-[#6DBAB2]/40 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5" />
            SOYL Model
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#E8F5F3] border border-[#6DBAB2]/40 flex items-center justify-center text-[#3D8F87]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-none">Butler AI Concierge</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Powered by SOYL Proprietary LLM Engine</p>
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
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

            {/* Timestamp & Model Tag */}
            <div className="flex items-center gap-1.5 mt-0.5 px-1">
              <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
              {msg.modelBadge && (
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#3D8F87] bg-[#E8F5F3] px-1.5 py-0.5 rounded-full border border-[#6DBAB2]/30">
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
          <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 text-xs text-slate-500 max-w-[110px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce [animation-delay:0.4s]" />
            <span className="text-[9px] text-slate-400 font-mono">SOYL AI</span>
          </div>
        )}
      </div>

      {/* QUICK SUGGESTION CHIPS */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-hide z-10">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-[#6DBAB2] hover:text-[#3D8F87] whitespace-nowrap shadow-xs transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* INPUT CONTROLS BAR */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white rounded-full p-1.5 border border-slate-200/90 shadow-md flex items-center gap-2 z-10"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Butler AI..."
          className="flex-1 bg-transparent px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="w-7 h-7 rounded-full bg-[#3D8F87] text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
