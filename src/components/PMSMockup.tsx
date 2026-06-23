"use client";

import { motion } from "framer-motion";
import { BedDouble, Users, TrendingUp, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";

export default function PMSMockup() {
  return (
    <div className="w-full aspect-[16/10] bg-[#F8FAFC] flex flex-col font-sans text-sm border-t border-gray-200/60 overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 bg-white border-b border-gray-200/60 flex items-center px-6 justify-between shrink-0">
        <div className="font-semibold text-[var(--color-charcoal)]">PMS Lite Overview</div>
        <div className="flex gap-4 text-xs text-gray-500 font-medium">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 92% Occ</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 12 Arrivals</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          {[
            { label: "Occupancy", val: "92.4%", icon: BedDouble, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "RevPAR", val: "$142.50", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "In-House", val: "156 Guests", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Arrivals", val: "12 Pending", icon: CalendarIcon, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: i * 0.1}} className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon size={14} />
                </div>
              </div>
              <div className="text-lg font-bold text-[var(--color-charcoal)]">{kpi.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Tape Chart / Rooms Area */}
        <div className="flex-1 bg-white border border-gray-200/60 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="h-10 border-b border-gray-100 flex items-center px-4 justify-between bg-gray-50/50">
            <span className="font-medium text-gray-700">Room Status Matrix</span>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
            {[
              { room: "101 - King", guest: "Smith, J.", status: "Clean", color: "bg-emerald-100 border-emerald-200 text-emerald-800" },
              { room: "102 - Queen", guest: "Vacant", status: "Dirty", color: "bg-amber-100 border-amber-200 text-amber-800" },
              { room: "103 - Suite", guest: "Williams, R.", status: "Clean", color: "bg-blue-100 border-blue-200 text-blue-800" },
              { room: "104 - King", guest: "Davis, M.", status: "Clean", color: "bg-emerald-100 border-emerald-200 text-emerald-800" },
            ].map((row, i) => (
              <motion.div key={i} initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.3 + (i * 0.1)}} className="flex items-center gap-4">
                <div className="w-24 text-xs font-medium text-gray-500">{row.room}</div>
                <div className={`flex-1 h-8 rounded-md border flex items-center px-3 text-xs font-medium ${row.color}`}>
                  {row.guest} <span className="ml-auto opacity-70 flex items-center gap-1"><CheckCircle2 size={12} /> {row.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
