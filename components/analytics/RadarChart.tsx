"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";

interface RadarSeries {
  id: string;
  name: string;
  color: string;
  values: Record<string, number>;
}

interface RadarChartProps {
  skills: string[];
  series: RadarSeries[];
  teamAverage?: Record<string, number>;
  showTeamAverage?: boolean;
}

export default function RadarChart({
  skills,
  series,
  teamAverage,
  showTeamAverage = false,
}: RadarChartProps) {
  const chartData = skills.map((skill) => {
    const entry: Record<string, number | string> = { skill };
    series.forEach((item) => {
      entry[item.id] = item.values[skill] ?? 0;
    });
    if (showTeamAverage && teamAverage) {
      entry.teamAverage = teamAverage[skill] ?? 0;
    }
    return entry;
  });

  const legendPayload = series.map((item) => ({
    value: item.name,
    id: item.id,
    type: "circle" as const,
    color: item.color,
  }));

  if (showTeamAverage && teamAverage) {
    legendPayload.push({
      value: "Team Average",
      id: "teamAverage",
      type: "line" as const,
      color: "rgba(255,255,255,0.8)",
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        className="rounded-lg border border-white/10 bg-[#0c0c18]/90 px-4 py-3 text-sm text-white shadow-xl backdrop-blur"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((item: any) => (
            <div
              key={item.dataKey}
              className="flex items-center justify-between gap-6"
            >
              <span className="flex items-center gap-2 text-white/70">
                <span
                  className="inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span className="text-white font-semibold">{item.value}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
          data={chartData}
        >
          <PolarGrid radialLines={true} stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 14 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={6}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }}
            stroke="rgba(255,255,255,0.1)"
          />
          {showTeamAverage && teamAverage && (
            <Radar
              key="teamAverage"
              dataKey="teamAverage"
              name="Team Average"
              stroke="rgba(255,255,255,0.8)"
              fill="rgba(255,255,255,0.05)"
              strokeDasharray="6 5"
              strokeWidth={2}
              fillOpacity={0.1}
            />
          )}
          {series.map((item) => (
            <Radar
              key={item.id}
              dataKey={item.id}
              name={item.name}
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.25}
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#0c0c18", strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              isAnimationActive
            />
          ))}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <Legend
            wrapperStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
            iconType="circle"
            payload={legendPayload}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
