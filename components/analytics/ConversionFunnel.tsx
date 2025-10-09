"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownRight, Clock, Users2 } from "lucide-react";
import { useMemo, useState } from "react";

interface RepPerformance {
  rep: string;
  conversion: number;
}

export interface FunnelStage {
  name: string;
  percentage: number;
  avgTime: string;
  dropoffReasons?: string[];
  repBreakdown?: RepPerformance[];
}

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

export default function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const drops = useMemo(() => {
    return stages.map((stage, index) => {
      if (index === 0) return 0;
      return Number(
        (stages[index - 1].percentage - stage.percentage).toFixed(1),
      );
    });
  }, [stages]);

  const biggestDropIndex = useMemo(() => {
    let drop = 0;
    let idx = -1;
    drops.forEach((value, index) => {
      if (index === 0) return;
      if (value > drop) {
        drop = value;
        idx = index;
      }
    });
    return idx;
  }, [drops]);

  const getWidth = (percentage: number, index: number) => {
    if (index === 0) return "100%";
    return `${Math.max(percentage, 18)}%`;
  };

  const getGradient = (percentage: number) => {
    if (percentage >= 80) return "from-[#7c3aed] to-[#db2777]";
    if (percentage >= 60) return "from-[#9333ea] to-[#e11d48]";
    if (percentage >= 40) return "from-[#a855f7] to-[#ef4444]";
    return "from-[#c084fc] to-[#f97316]";
  };

  return (
    <div className="flex flex-col gap-6">
      {stages.map((stage, index) => {
        const isExpanded = expandedStage === index;
        const drop = drops[index];
        const isBiggestDrop = biggestDropIndex === index && drop > 0;

        return (
          <motion.div
            key={stage.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.07 }}
          >
            <button
              onClick={() => setExpandedStage(isExpanded ? null : index)}
              className="group flex w-full flex-col gap-2 text-left"
            >
              <div className="relative">
                <motion.div
                  className={`relative overflow-hidden rounded-2xl border ${
                    isBiggestDrop
                      ? "border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.35)]"
                      : "border-white/10"
                  }`}
                  style={{ width: getWidth(stage.percentage, index) }}
                  whileHover={{ x: 6 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className={`flex h-[60px] items-center justify-between bg-gradient-to-r ${getGradient(stage.percentage)} px-6`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.08 }}
                    style={{ transformOrigin: "left center" }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-base font-semibold uppercase tracking-[0.3em] text-white">
                        {stage.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[24px] font-bold text-white leading-none">
                        {stage.percentage}%
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.35em] text-white/70">
                        {" "}
                        Conversion{" "}
                      </span>
                    </div>
                  </motion.div>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20" />

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 pb-3 text-xs text-white/80">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Avg time {stage.avgTime}
                    </span>
                    {index > 0 && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1 text-sm font-semibold"
                      >
                        <ArrowDownRight
                          className={`h-4 w-4 ${drop > 0 ? "text-red-200" : "text-emerald-200"}`}
                        />
                        {drop > 0 ? `-${drop}% drop` : "+0%"}
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              </div>

              {drop > 0 && (
                <div className="ml-8 flex items-center gap-4 text-sm text-red-300">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="font-medium">
                    {drop}% of conversations lost vs previous stage
                  </span>
                </div>
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-8 mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">
                        Drop-off insights
                      </h4>
                      <ul className="space-y-2">
                        {(
                          stage.dropoffReasons || ["No major drop-off detected"]
                        ).map((reason, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-white/70"
                          >
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {stage.repBreakdown && stage.repBreakdown.length > 0 && (
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                          <Users2 className="h-4 w-4 text-white/40" />
                          Rep performance
                        </h4>
                        <div className="space-y-2">
                          {stage.repBreakdown.map((rep) => (
                            <div
                              key={rep.rep}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                            >
                              <span className="text-sm text-white/80">
                                {rep.rep}
                              </span>
                              <span className="text-sm font-semibold text-white">
                                {rep.conversion}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
