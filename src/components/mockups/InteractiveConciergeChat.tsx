"use client";

import { useState } from "react";
import { Send, Sparkles, CheckCircle2 } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  status?: string;
}

const QUICK_PROMPTS = [
  "Send extra towels please",
  "What time does the pool close?",
  "Can I request 1-hour late checkout?",
  "Order breakfast for 8:30 AM",
];

const PRESET_AI_RESPONSES: Record<string, string> = {
  "send extra towels please": "I've logged your request for extra towels. Housekeeping has been dispatched to Room 104 with fresh bath towels.",
  "what time does the pool close?": "The heated rooftop pool is open until 10:00 PM today. Towels and refreshments are available at the deck bar.",
  "can i request 1-hour late checkout?": "I've checked availability for Room 104. Late checkout at 12:00 PM is confirmed with complimentary approval!",
  "order breakfast for 8:30 am": "Your breakfast order for 8:30 AM has been placed with Room Service. Our chef will prepare your hot continental spread.",
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
      text: "I've passed your request for extra towels to Housekeeping. A team member is on the way to Room 104.",
      timestamp: "10:14 AM",
      status: "Dispatched",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const newId = `msg-user-${messages.length + 1}`;
    const userMsg: Message = {
      id: newId,
      sender: "user",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking and instant response (or API lookup)
    setTimeout(() => {
      const lower = text.toLowerCase();
      let responseText = PRESET_AI_RESPONSES[lower];

      if (!responseText) {
        if (lower.includes("towel") || lower.includes("pillow") || lower.includes("clean")) {
          responseText = `Housekeeping ticket dispatched for Room 104. An attendant will arrive within 5-8 minutes.`;
        } else if (lower.includes("checkout") || lower.includes("time") || lower.includes("leave")) {
          responseText = `Standard checkout is 11:00 AM. Late checkout until 1:00 PM has been reserved for your stay.`;
        } else if (lower.includes("eat") || lower.includes("food") || lower.includes("menu") || lower.includes("dinner")) {
          responseText = `Our in-house bistro is serving dinner until 11:00 PM. Would you like me to reserve a table or send a room menu?`;
        } else {
          responseText = `I've received your request ("${text}"). Butler AI has routed this directly to the front desk team for instant assistance.`;
        }
      }

      const botMsg: Message = {
        id: `msg-bot-${Math.random().toString(36).substring(2, 9)}`,
        sender: "bot",
        text: responseText,
        timestamp: "Just now",
        status: "Verified",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="w-full h-full bg-[#F4F5F7] flex flex-col justify-between pt-7 pb-2 px-3 relative font-sans text-slate-800">
      {/* HEADER BAR */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-200/80 shadow-sm z-10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Grand Plaza &bull; Room 104
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Guest Mode</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#E8F5F3] border border-[#6DBAB2]/40 flex items-center justify-center text-[#3D8F87]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-none">Butler AI Concierge</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Instant responses in 50+ languages</p>
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES SCROLL AREA */}
      <div className="flex-1 my-2 overflow-y-auto space-y-2.5 px-0.5 scrollbar-hide flex flex-col justify-end">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.sender === "user"
                  ? "bg-[#0A0D14] text-white rounded-br-none font-medium"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-none font-normal"
              }`}
            >
              {msg.text}
            </div>

            {/* Timestamp & Status Badge */}
            <div className="flex items-center gap-1 mt-0.5 px-1">
              <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
              {msg.status && (
                <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-0.5">
                  &bull; <CheckCircle2 className="w-2.5 h-2.5 inline" /> {msg.status}
                </span>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 text-xs text-slate-500 max-w-[100px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D8F87] animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* QUICK SUGGESTION CHIPS */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-hide z-10">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-[#6DBAB2] hover:text-[#3D8F87] whitespace-nowrap shadow-xs transition-colors shrink-0"
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
          placeholder="Type a request..."
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
