"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  Circle,
  Clock,
  Eye,
  Lightbulb,
  ListChecks,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type InsightSeverity = "urgent" | "warning" | "opportunity" | "info";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  details: string;
  confidence: number;
  actionUrl?: string;
}

interface AIInsightsPanelProps {
  insights: Insight[];
  onRefresh?: () => void;
  refreshing?: boolean;
  nextRefreshIn?: number;
}

const severityMeta: Record<
  InsightSeverity,
  {
    label: string;
    color: string;
    ring: string;
    icon: React.ElementType;
    actionLabel: string;
  }
> = {
  urgent: {
    label: "Urgent",
    color: "text-red-300",
    ring: "border-l-[3px] border-red-500",
    icon: AlertTriangle,
    actionLabel: "Escalate",
  },
  warning: {
    label: "Warning",
    color: "text-orange-300",
    ring: "border-l-[3px] border-orange-400",
    icon: Circle,
    actionLabel: "Investigate",
  },
  opportunity: {
    label: "Opportunity",
    color: "text-emerald-300",
    ring: "border-l-[3px] border-emerald-400",
    icon: Rocket,
    actionLabel: "Activate Playbook",
  },
  info: {
    label: "Info",
    color: "text-sky-300",
    ring: "border-l-[3px] border-sky-400",
    icon: Lightbulb,
    actionLabel: "Share",
  },
};

export default function AIInsightsPanel({
  insights,
  onRefresh,
  refreshing = false,
  nextRefreshIn = 60,
}: AIInsightsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    insights[0]?.id ?? null,
  );
  const [timer, setTimer] = useState(nextRefreshIn);

  useEffect(() => {
    setTimer(nextRefreshIn);
  }, [nextRefreshIn, insights]);

  useEffect(() => {
    if (!onRefresh) return;
    const tick = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          onRefresh();
          return nextRefreshIn;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [onRefresh, nextRefreshIn]);

  const timerLabel = useMemo(() => {
    if (!onRefresh) return null;
    return `Updates in ${timer}s`;
  }, [timer, onRefresh]);

  return (
    <div className="relative space-y-4 pb-12">
      {insights.map((insight, index) => {
        const severity = severityMeta[insight.severity];
        const Icon = severity.icon;
        const isExpanded = expandedId === insight.id;

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] ${severity.ring} overflow-hidden backdrop-blur-sm`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white/[0.06] p-2">
                  <Icon className={`h-4 w-4 ${severity.color}`} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold uppercase tracking-[0.3em] ${severity.color}`}
                      >
                        {severity.label}
                      </span>
                      <span className="text-xs text-white/40">
                        Confidence {insight.confidence}%
                      </span>
                    </div>
                    <motion.span
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs uppercase tracking-[0.3em] text-white/30"
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </motion.span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-white/60">{insight.description}</p>
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/[0.06] bg-white/[0.03] px-5 py-4"
                >
                  <div className="space-y-3 text-sm text-white/70">
                    <div className="flex items-start gap-2">
                      <BrainCircuit className="mt-0.5 h-4 w-4 text-white/40" />
                      <p>{insight.details}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/10">
                        <Eye className="h-4 w-4 text-white/60" />
                        View Details
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-r from-purple-500/40 to-pink-500/40 px-3 py-2 text-xs font-semibold text-white transition hover:from-purple-500/60 hover:to-pink-500/60">
                        <ListChecks className="h-4 w-4 text-white/80" />
                        {severity.actionLabel}
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-semibold text-white/70 transition hover:text-white">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {onRefresh && (
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            whileHover={{ scale: refreshing ? 1 : 1.01 }}
            whileTap={{ scale: refreshing ? 1 : 0.99 }}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Generating…" : "Generate New Insights"}
          </motion.button>
        </div>
      )}

      {timerLabel && (
        <div className="pointer-events-none absolute -bottom-2 right-0 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs text-white/50">
          <Clock className="h-3.5 w-3.5" />
          {timerLabel}
        </div>
      )}
    </div>
  );
}
