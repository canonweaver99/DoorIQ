"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  change: number;
  avatar?: string;
}

interface LeaderboardMiniProps {
  entries: LeaderboardEntry[];
  title?: string;
}

export default function LeaderboardMini({
  entries,
  title,
}: LeaderboardMiniProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
          {title || "Team Momentum"}
        </h3>
        <span className="text-xs text-white/40">Weekly cohort changes</span>
      </div>

      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
                {String(entry.rank).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2">
                {entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-medium text-white">
                    {entry.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{entry.name}</p>
                  <p className="text-xs text-white/40">Score {entry.score}</p>
                </div>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${entry.change >= 0 ? "text-emerald-300" : "text-red-300"}`}
            >
              {entry.change >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{Math.abs(entry.change)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
