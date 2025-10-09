"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import RepComparison from "@/components/analytics/RepComparison";
import RadarChart from "@/components/analytics/RadarChart";
import ConversionFunnel, {
  FunnelStage,
} from "@/components/analytics/ConversionFunnel";
import AIInsightsPanel, {
  Insight,
} from "@/components/analytics/AIInsightsPanel";
import DateRangePicker from "@/components/analytics/DateRangePicker";

interface RepProfile {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar?: string;
}

const repProfiles: RepProfile[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Strategic Closer",
    color: "#22d3ee",
  },
  {
    id: "2",
    name: "Mike Chen",
    role: "Discovery Specialist",
    color: "#8b5cf6",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Storytelling Pro",
    color: "#f97316",
  },
  {
    id: "4",
    name: "James Smith",
    role: "Objection Strategist",
    color: "#6366f1",
  },
];

const skills = [
  "Rapport Building",
  "Discovery",
  "Objection Handling",
  "Closing",
  "Speaking Mechanics",
];

const teamAverages: Record<string, number> = {
  "Rapport Building": 76,
  Discovery: 78,
  "Objection Handling": 72,
  Closing: 70,
  "Speaking Mechanics": 74,
};

const repSkillScores: Record<string, Record<string, number>> = {
  "1": {
    "Rapport Building": 92,
    Discovery: 88,
    "Objection Handling": 79,
    Closing: 87,
    "Speaking Mechanics": 83,
  },
  "2": {
    "Rapport Building": 82,
    Discovery: 94,
    "Objection Handling": 73,
    Closing: 80,
    "Speaking Mechanics": 77,
  },
  "3": {
    "Rapport Building": 89,
    Discovery: 86,
    "Objection Handling": 81,
    Closing: 84,
    "Speaking Mechanics": 90,
  },
  "4": {
    "Rapport Building": 74,
    Discovery: 76,
    "Objection Handling": 91,
    Closing: 82,
    "Speaking Mechanics": 71,
  },
};

const funnelStages: FunnelStage[] = [
  {
    name: "Door Opened",
    percentage: 100,
    avgTime: "0:29",
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 100 },
      { rep: "Mike Chen", conversion: 100 },
      { rep: "Emily Rodriguez", conversion: 100 },
    ],
  },
  {
    name: "Rapport Built",
    percentage: 83,
    avgTime: "2:12",
    dropoffReasons: [
      "Opening rapport script delivered too quickly",
      "Missed personal connection cues",
      "Insufficient mirroring of homeowner energy",
    ],
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 91 },
      { rep: "Mike Chen", conversion: 87 },
      { rep: "Emily Rodriguez", conversion: 85 },
    ],
  },
  {
    name: "Needs Discovered",
    percentage: 69,
    avgTime: "4:15",
    dropoffReasons: [
      "Average of 1.6 open questions before pitching",
      "Clarifying questions skipped after pain points",
      "Long pauses leading to topic switches",
    ],
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 80 },
      { rep: "Mike Chen", conversion: 76 },
      { rep: "Emily Rodriguez", conversion: 71 },
    ],
  },
  {
    name: "Solution Presented",
    percentage: 56,
    avgTime: "3:33",
    dropoffReasons: [
      "Solution not anchored to quantified pain",
      "Jargon introduced without visuals",
      "Follow-up questions ignored",
    ],
    repBreakdown: [
      { rep: "Emily Rodriguez", conversion: 67 },
      { rep: "Sarah Johnson", conversion: 60 },
      { rep: "James Smith", conversion: 57 },
    ],
  },
  {
    name: "Objections Handled",
    percentage: 43,
    avgTime: "5:07",
    dropoffReasons: [
      "Defensive tone flagged in 22% of responses",
      "Clarifying questions missing after first objection",
      "Reps concede on price before value reinforcement",
    ],
    repBreakdown: [
      { rep: "James Smith", conversion: 63 },
      { rep: "Sarah Johnson", conversion: 53 },
      { rep: "Mike Chen", conversion: 47 },
    ],
  },
  {
    name: "Close Attempted",
    percentage: 34,
    avgTime: "2:01",
    dropoffReasons: [
      "Closing question delayed beyond buying signals",
      "Assumptive close not attempted",
      "No re-cap of core motivators",
    ],
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 48 },
      { rep: "Emily Rodriguez", conversion: 39 },
      { rep: "James Smith", conversion: 36 },
    ],
  },
  {
    name: "Sale Closed",
    percentage: 22,
    avgTime: "1:41",
    dropoffReasons: [
      "Financing objections unresolved",
      "Follow-up commitments not scheduled",
      "Missing confidence language in final ask",
    ],
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 32 },
      { rep: "Emily Rodriguez", conversion: 23 },
      { rep: "Mike Chen", conversion: 20 },
    ],
  },
];

export default function AnalyticsDashboard() {
  const [selectedReps, setSelectedReps] = useState<string[]>(["1", "2"]);
  const [showTeamAverage, setShowTeamAverage] = useState(true);
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  const colorMap = useMemo(() => {
    return repProfiles.reduce<Record<string, string>>((acc, rep) => {
      acc[rep.id] = rep.color;
      return acc;
    }, {});
  }, []);

  const radarSeries = useMemo(() => {
    return selectedReps.map((repId) => ({
      id: repId,
      name: repProfiles.find((rep) => rep.id === repId)?.name ?? `Rep ${repId}`,
      color: colorMap[repId] || "#a855f7",
      values: repSkillScores[repId] ?? {},
    }));
  }, [selectedReps, colorMap]);

  const generateInsights = useCallback(() => {
    const payload: Insight[] = [
      {
        id: "predictive-sarah",
        severity: "opportunity",
        title: "Sarah Johnson 84% forecast to lead next week",
        description:
          "Maintained 90%+ rapport and 80% objection control for 6 straight sessions.",
        details:
          "Assign premium appointments Monday–Wednesday; capture her call for playbook snippet.",
        confidence: 84,
      },
      {
        id: "anomaly-marcus",
        severity: "urgent",
        title: "James Smith handling dip: -19% objection win rate",
        description:
          "Noticeable hesitation after pricing pushback since Thursday evening calls.",
        details:
          "Review objection recordings, run objection framing refresher, and pair him with Sarah for live shadow.",
        confidence: 89,
      },
      {
        id: "pattern-window",
        severity: "warning",
        title: "Conversion 16% higher in 1–3 PM window",
        description:
          "Discovery depth and assumptive closes spike mid-afternoon across all reps.",
        details:
          "Stack high-intent appointments in the 1–3 PM block and mirror afternoon talk track in scripts.",
        confidence: 80,
      },
      {
        id: "correlation-assumptive",
        severity: "info",
        title: "Assumptive phrasing lifts close rate by 32%",
        description:
          "Sessions logging 3+ assumptive statements convert 1.32× more regardless of rep tenure.",
        details:
          "Push assumptive phrase micro-card to LMS; highlight Sarah/Emily clips in next huddle.",
        confidence: 83,
      },
      {
        id: "training-objections",
        severity: "warning",
        title: "Schedule objection mastery huddle — 4 reps slipping",
        description:
          "Marcus and Alex average 2.3 unresolved objections per call this week.",
        details:
          "Book a 45-minute drill led by James: focus on clarification loops and value restatement.",
        confidence: 76,
      },
    ];

    setInsights(payload);
  }, []);

  const handleRefreshInsights = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      generateInsights();
      setRefreshing(false);
    }, 900);
  }, [generateInsights, refreshing]);

  useEffect(() => {
    generateInsights();
  }, [generateInsights, selectedReps]);

  const handleExport = useCallback(() => {
    console.log("Export manager analytics for reps:", selectedReps.join(", "));
  }, [selectedReps]);

  const leftColumn = (
    <div className="flex h-full flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
      >
        <RepComparison
          availableReps={repProfiles}
          selectedReps={selectedReps}
          onSelectionChange={setSelectedReps}
          minSelection={2}
          maxSelection={4}
          colorMap={colorMap}
        />

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <button
            onClick={() => setShowTeamAverage((prev) => !prev)}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              showTeamAverage
                ? "border-purple-500/40 bg-purple-500/15 text-purple-100"
                : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:text-white"
            }`}
          >
            <span>Compare against team baseline</span>
            <div
              className={`relative h-5 w-10 rounded-full transition ${showTeamAverage ? "bg-purple-500" : "bg-white/20"}`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  showTeamAverage ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
              Skills Radar
            </h3>
            <p className="text-xs text-white/40">Hover points to reveal rep scores</p>
          </div>
        </div>
        <div className="mt-4 h-[460px]">
          <RadarChart
            skills={skills}
            series={radarSeries}
            teamAverage={teamAverages}
            showTeamAverage={showTeamAverage}
          />
        </div>
      </motion.div>
    </div>
  );

  const centerColumn = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            Conversion Flow
          </h3>
          <p className="text-xs text-white/40">
            Tap a stage to inspect drop-off reasons and rep performance
          </p>
        </div>
      </div>
      <div className="mt-6 flex-1">
        <ConversionFunnel stages={funnelStages} />
      </div>
    </motion.div>
  );

  const rightColumn = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5"
    >
      <div className="mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
          AI Insights
        </h3>
        <p className="text-xs text-white/40">Prioritized actions and alerts</p>
      </div>
      <AIInsightsPanel
        insights={insights}
        onRefresh={handleRefreshInsights}
        refreshing={refreshing}
        nextRefreshIn={60}
      />
    </motion.div>
  );

  const sections = useMemo(
    () => [
      { key: "compare", content: leftColumn },
      { key: "funnel", content: centerColumn },
      { key: "insights", content: rightColumn },
    ],
    [leftColumn, centerColumn, rightColumn],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-slate-400">Action-ready intelligence for managers</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/20 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-600/30 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export View
          </button>
        </div>
      </div>

      <div className="-mx-2 mb-6 flex snap-x gap-4 overflow-x-auto px-2 pb-4 xl:hidden">
        {sections.map((section) => (
          <div key={section.key} className="min-w-[92%] snap-center">
            {section.content}
          </div>
        ))}
      </div>

      <div className="hidden xl:grid xl:grid-cols-3 xl:gap-6">
        {sections.map((section) => (
          <div key={section.key} className="h-full">
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}
