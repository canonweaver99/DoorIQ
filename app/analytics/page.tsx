"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import RadarChart from "@/components/analytics/RadarChart";
import ConversionFunnel, {
  FunnelStage,
} from "@/components/analytics/ConversionFunnel";
import AIInsightsPanel, {
  Insight,
} from "@/components/analytics/AIInsightsPanel";
import RepComparison from "@/components/analytics/RepComparison";
import DateRangePicker from "@/components/analytics/DateRangePicker";

type RepProfile = {
  id: string;
  name: string;
  role: string;
  color: string;
  avatar?: string;
};

const skills = [
  "Rapport Building",
  "Discovery",
  "Objection Handling",
  "Closing",
  "Speaking Mechanics",
];

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
  { id: "5", name: "Alex Thompson", role: "Rapport Builder", color: "#14b8a6" },
  {
    id: "6",
    name: "Lisa Anderson",
    role: "Consultative Guide",
    color: "#facc15",
  },
  {
    id: "7",
    name: "Marcus Green",
    role: "Closer In Training",
    color: "#ec4899",
  },
];

const teamAverages: Record<string, number> = {
  "Rapport Building": 74,
  Discovery: 77,
  "Objection Handling": 71,
  Closing: 68,
  "Speaking Mechanics": 73,
};

const repSkillScores: Record<string, Record<string, number>> = {
  "1": {
    "Rapport Building": 92,
    Discovery: 90,
    "Objection Handling": 78,
    Closing: 88,
    "Speaking Mechanics": 82,
  },
  "2": {
    "Rapport Building": 80,
    Discovery: 94,
    "Objection Handling": 74,
    Closing: 79,
    "Speaking Mechanics": 76,
  },
  "3": {
    "Rapport Building": 88,
    Discovery: 86,
    "Objection Handling": 81,
    Closing: 83,
    "Speaking Mechanics": 91,
  },
  "4": {
    "Rapport Building": 71,
    Discovery: 74,
    "Objection Handling": 92,
    Closing: 84,
    "Speaking Mechanics": 69,
  },
  "5": {
    "Rapport Building": 95,
    Discovery: 82,
    "Objection Handling": 68,
    Closing: 72,
    "Speaking Mechanics": 78,
  },
  "6": {
    "Rapport Building": 77,
    Discovery: 79,
    "Objection Handling": 73,
    Closing: 70,
    "Speaking Mechanics": 86,
  },
  "7": {
    "Rapport Building": 68,
    Discovery: 71,
    "Objection Handling": 59,
    Closing: 56,
    "Speaking Mechanics": 64,
  },
};

const funnelStages: FunnelStage[] = [
  {
    name: "Door Opened",
    percentage: 100,
    avgTime: "0:28",
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 100 },
      { rep: "Mike Chen", conversion: 100 },
      { rep: "Emily Rodriguez", conversion: 100 },
    ],
  },
  {
    name: "Rapport Built",
    percentage: 84,
    avgTime: "2:05",
    dropoffReasons: [
      "Conversation pace too fast in first 90 seconds",
      "Missed personal connection cues from homeowner",
      "Script adherence overriding genuine listening",
    ],
    repBreakdown: [
      { rep: "Alex Thompson", conversion: 92 },
      { rep: "Sarah Johnson", conversion: 90 },
      { rep: "Mike Chen", conversion: 86 },
    ],
  },
  {
    name: "Needs Discovered",
    percentage: 68,
    avgTime: "4:18",
    dropoffReasons: [
      "Only 1.4 open-ended questions on average",
      "Follow-up questions missing on key pain points",
      "Reps pivot to pitch before commitment signals",
    ],
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 82 },
      { rep: "Mike Chen", conversion: 77 },
      { rep: "Emily Rodriguez", conversion: 71 },
    ],
  },
  {
    name: "Solution Presented",
    percentage: 55,
    avgTime: "3:32",
    dropoffReasons: [
      "Message not tailored to articulated needs",
      "Jargon-heavy explanations reduce clarity",
      "Visual aids not utilized in 46% of sessions",
    ],
    repBreakdown: [
      { rep: "Emily Rodriguez", conversion: 68 },
      { rep: "Sarah Johnson", conversion: 63 },
      { rep: "James Smith", conversion: 58 },
    ],
  },
  {
    name: "Objections Handled",
    percentage: 42,
    avgTime: "5:12",
    dropoffReasons: [
      "Defensive tone flagged in 28% of responses",
      "Clarifying questions missing after first objection",
      "Reps concede on price before value reinforcement",
    ],
    repBreakdown: [
      { rep: "James Smith", conversion: 61 },
      { rep: "Sarah Johnson", conversion: 52 },
      { rep: "Mike Chen", conversion: 48 },
    ],
  },
  {
    name: "Close Attempted",
    percentage: 35,
    avgTime: "2:05",
    dropoffReasons: [
      "Closing language delayed beyond optimal window",
      "No assumptive close attempt logged",
      "Failure to resurface primary buying motivation",
    ],
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 49 },
      { rep: "Emily Rodriguez", conversion: 41 },
      { rep: "James Smith", conversion: 39 },
    ],
  },
  {
    name: "Sale Closed",
    percentage: 21,
    avgTime: "1:42",
    dropoffReasons: [
      "Payment objections unresolved",
      "Re-engagement attempts not scheduled",
      "Next-step clarity missing in 32% of calls",
    ],
    repBreakdown: [
      { rep: "Sarah Johnson", conversion: 32 },
      { rep: "Emily Rodriguez", conversion: 24 },
      { rep: "Mike Chen", conversion: 22 },
    ],
  },
];

export default function AnalyticsPage() {
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
        title: "Sarah Johnson 87% likely top performer next week",
        description:
          "Forecast based on +12% discovery depth and 96% rapport rating across her last eight sessions.",
        details:
          "Route high-value appointments to Sarah early-week and mirror her discovery script in coaching huddles.",
        confidence: 87,
      },
      {
        id: "anomaly-marcus",
        severity: "urgent",
        title: "Marcus closing rate dropped 23% — investigate now",
        description:
          "Closing attempts fell from 42% to 19% with hesitation after pricing objections in the last five calls.",
        details:
          "Audit Thursday/Friday recordings, deploy objection flashcards, and pair Marcus with James for live shadowing.",
        confidence: 91,
      },
      {
        id: "pattern-window",
        severity: "warning",
        title: "Team conversion 18% higher between 2 PM – 4 PM",
        description:
          "Afternoon appointments show deeper discovery and more assumptive closes across all reps.",
        details:
          "Prioritize high-intent leads in the 2–4 PM block and replicate afternoon talk tracks for morning crews.",
        confidence: 82,
      },
      {
        id: "correlation-assumptive",
        severity: "info",
        title: "Assumptive language correlates with 34% higher close rate",
        description:
          "Sessions logging 3+ assumptive statements convert 1.34× more regardless of rep tenure.",
        details:
          "Distribute top assumptive phrases from Sarah and Emily via micro-coaching cards and reinforce in LMS.",
        confidence: 85,
      },
      {
        id: "training-objections",
        severity: "warning",
        title: "Schedule objection handling session — 5 reps struggling",
        description:
          "Lisa, Marcus, and three new hires average 2.1 unresolved objections per call this week.",
        details:
          "Book a 45-minute drill led by James Smith focusing on clarifying questions and value reinforcement loops.",
        confidence: 78,
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
    console.log("Exporting analytics view for reps:", selectedReps.join(", "));
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
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
              Skills Radar
            </h2>
            <p className="text-xs text-white/40">
              Hover points to reveal exact rep scores
            </p>
          </div>
        </div>
        <div className="mt-4 h-[520px]">
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
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            Conversion Flow
          </h2>
          <p className="text-xs text-white/40">
            Tap a stage to explore rep performance and drop-off drivers
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
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
          AI Insights
        </h2>
        <p className="text-xs text-white/40">
          Highest-impact actions ranked by urgency
        </p>
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
      { key: "comparison", content: leftColumn },
      { key: "funnel", content: centerColumn },
      { key: "insights", content: rightColumn },
    ],
    [leftColumn, centerColumn, rightColumn],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="mx-auto max-w-[1800px] px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Performance Analytics
            </h1>
            <p className="text-sm text-white/60">
              Actionable intelligence for proactive coaching — not passive
              dashboards
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/20 px-4 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-600/30 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Export This View
            </button>
          </div>
        </div>

        <div className="-mx-6 mb-8 flex snap-x gap-4 overflow-x-auto px-6 pb-5 xl:hidden">
          {sections.map((section) => (
            <div key={section.key} className="min-w-[90%] snap-center">
              {section.content}
            </div>
          ))}
        </div>

        <div className="hidden xl:grid xl:grid-cols-3 xl:gap-8">
          {sections.map((section) => (
            <div key={section.key} className="h-full">
              {section.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
