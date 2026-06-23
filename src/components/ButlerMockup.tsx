"use client";

import { motion } from "framer-motion";
import { Search, User, Bot, Sparkles, Send, Paperclip } from "lucide-react";

export default function ButlerMockup() {
  return (
    <div className="w-full aspect-[16/10] bg-gray-50 flex overflow-hidden font-sans text-sm border-t border-gray-200/60">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200/60 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--color-mint-dark)] text-white flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <span className="font-semibold text-gray-800">Butler AI</span>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Guests</div>
          {[
            { name: "Room 402 - John Doe", req: "Extra Towels", time: "2m ago", active: true },
            { name: "Room 215 - Sarah M.", req: "Dinner Res.", time: "15m ago", active: false },
            { name: "Room 501 - Alex K.", req: "Late Checkout", time: "1h ago", active: false },
          ].map((chat, i) => (
            <div key={i} className={`p-3 rounded-xl border ${chat.active ? 'bg-[var(--color-mint-light)] border-[var(--color-mint)]' : 'bg-white border-gray-100'} cursor-pointer flex flex-col gap-1`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${chat.active ? 'text-[var(--color-mint-dark)]' : 'text-gray-700'}`}>{chat.name}</span>
                <span className="text-[10px] text-gray-400">{chat.time}</span>
              </div>
              <span className="text-gray-500 text-xs truncate">{chat.req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        <div className="h-14 bg-white border-b border-gray-200/60 flex items-center px-6 justify-between">
          <span className="font-semibold text-gray-800">Room 402 Chat</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> AI Handling</span>
          </div>
        </div>
        
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden relative">
          <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="self-end max-w-[80%] bg-[var(--color-charcoal)] text-white p-3 rounded-2xl rounded-tr-sm">
            Hi, could we get some extra towels sent up? And what time does the pool close?
          </motion.div>
          <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}} className="self-start max-w-[80%] flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--color-mint-light)] flex items-center justify-center shrink-0 mt-1">
              <Bot size={14} className="text-[var(--color-mint-dark)]" />
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm text-gray-700 shadow-sm">
              I've just dispatched housekeeping with extra towels for Room 402. They should arrive in 5 minutes! <br/><br/>
              The rooftop pool is open until 10:00 PM tonight. Let me know if you need anything else!
            </div>
          </motion.div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white border border-gray-200 rounded-full p-2 flex items-center gap-3 shadow-sm">
              <button className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={18} /></button>
              <input type="text" placeholder="Type a message or let AI handle..." className="flex-1 bg-transparent outline-none text-sm" disabled />
              <button className="w-8 h-8 rounded-full bg-[var(--color-mint-dark)] text-white flex items-center justify-center"><Send size={14} className="-ml-0.5" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
