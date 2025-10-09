"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Rep {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface RepComparisonProps {
  availableReps: Rep[];
  selectedReps: string[];
  onSelectionChange: (repIds: string[]) => void;
  maxSelection?: number;
  minSelection?: number;
  colorMap?: Record<string, string>;
}

export default function RepComparison({
  availableReps,
  selectedReps,
  onSelectionChange,
  maxSelection = 4,
  minSelection = 2,
  colorMap = {},
}: RepComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleRep = (repId: string) => {
    if (selectedReps.includes(repId)) {
      if (selectedReps.length <= minSelection) return;
      onSelectionChange(selectedReps.filter((id) => id !== repId));
    } else if (selectedReps.length < maxSelection) {
      onSelectionChange([...selectedReps, repId]);
    }
  };

  return (
    <div className="relative space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-[0.25em] text-white/50">
            Select reps to compare
          </span>
          <span className="text-xs text-white/40">
            Choose {minSelection}-{maxSelection}
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-white/20"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {selectedReps.map((repId) => {
                const rep = availableReps.find((r) => r.id === repId);
                if (!rep) return null;
                const color = colorMap[repId] || "#a855f7";
                return (
                  <span
                    key={repId}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
                    style={{ backgroundColor: `${color}26`, color }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {rep.name}
                  </span>
                );
              })}
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-2 w-full rounded-2xl border border-white/12 bg-[#0A0420] p-2 shadow-2xl"
            >
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {availableReps.map((rep) => {
                  const isSelected = selectedReps.includes(rep.id);
                  const isDisabled =
                    !isSelected && selectedReps.length >= maxSelection;
                  const color = colorMap[rep.id] || "#a855f7";

                  return (
                    <button
                      key={rep.id}
                      onClick={() => !isDisabled && toggleRep(rep.id)}
                      disabled={isDisabled}
                      className={`
                        w-full rounded-xl px-3 py-2.5 text-left transition
                        ${
                          isSelected
                            ? "bg-white/[0.08] text-white"
                            : isDisabled
                              ? "cursor-not-allowed text-white/30"
                              : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {rep.avatar ? (
                            <img
                              src={rep.avatar}
                              alt={rep.name}
                              className="h-7 w-7 rounded-full"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-medium text-white">
                              {rep.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{rep.name}</p>
                            {rep.role && (
                              <p className="text-xs text-white/40">
                                {rep.role}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4" style={{ color }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedReps.length >= maxSelection && (
                <div className="mt-2 border-t border-white/10 pt-2 text-center text-xs text-white/50">
                  Maximum {maxSelection} reps
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {selectedReps.map((repId) => {
          const rep = availableReps.find((r) => r.id === repId);
          if (!rep) return null;
          const color = colorMap[repId] || "#a855f7";
          return (
            <div
              key={repId}
              className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.02] px-3 py-2"
              style={{ borderColor: `${color}40` }}
            >
              {rep.avatar ? (
                <img
                  src={rep.avatar}
                  alt={rep.name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, ${color}33, ${color}66)`,
                  }}
                >
                  {rep.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{rep.name}</p>
                <p className="text-xs text-white/40">
                  Included in radar + flow analysis
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
