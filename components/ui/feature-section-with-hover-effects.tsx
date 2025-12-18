import { cn } from "@/lib/utils";
import {
  Bot,
  MessageSquare,
  BarChart3,
  Shield,
  Trophy,
  LineChart,
  Zap,
  Users,
} from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FeaturesSectionProps {
  features?: Feature[];
}

export function FeaturesSectionWithHoverEffects({ features }: FeaturesSectionProps) {
  const defaultFeatures: Feature[] = [
    {
      title: "AI Roleplay Agents",
      description:
        "Practice with realistic AI homeowners that adapt to your pitch and throw real objections.",
      icon: <Bot className="w-6 h-6" />,
    },
    {
      title: "Real-time Feedback",
      description:
        "Instant coaching on tone, pacing, and persuasion techniques as you practice.",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      title: "Performance Analytics",
      description:
        "Deep insights into each rep's strengths, weaknesses, and improvement trajectory.",
      icon: <BarChart3 className="w-6 h-6" />,
    },
    {
      title: "Objection Handling",
      description:
        "Master tough objections with AI-powered scenarios that prepare reps for anything.",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      title: "Team Leaderboards",
      description:
        "Drive competition with gamified rankings that motivate your team.",
      icon: <Trophy className="w-6 h-6" />,
    },
    {
      title: "Manager Insights",
      description:
        "See where each rep needs coaching without sitting in on calls.",
      icon: <LineChart className="w-6 h-6" />,
    },
    {
      title: "Lightning Fast Setup",
      description:
        "Get your team onboarded and practicing in 10 minutes.",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: "Unlimited Practice",
      description:
        "No caps, no limits. Reps train as much as they need to become closers.",
      icon: <Users className="w-6 h-6" />,
    },
  ];

  const featuresToRender = features || defaultFeatures;

  return (
    <div className="flex justify-center w-full relative z-10 pt-8 pb-8 md:pt-12 md:pb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 max-w-7xl w-full">
        {featuresToRender.map((feature, index) => (
          <div key={feature.title} className="h-full flex">
            <Feature {...feature} index={index} totalFeatures={featuresToRender.length} />
          </div>
        ))}
      </div>
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
  totalFeatures,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  totalFeatures: number;
}) => {
  const isLeftColumn = index % 4 === 0;
  const isTopRow = index < 4;
  const isBottomRow = index >= totalFeatures - 4;

  return (
    <div
      className={cn(
        "flex flex-col py-6 md:py-8 lg:py-10 relative group/feature border-white/20 h-full min-h-[220px] md:min-h-[280px]",
        // Left border for left column only
        isLeftColumn && "border-l-[2px]",
        // Right border for all cards (creates dividers and right edge)
        "border-r-[2px]",
        // Top border for top row
        isTopRow && "border-t-[2px]",
        // Bottom border for all cards
        "border-b-[2px]",
        // Extra padding for bottom row
        isBottomRow && "pb-8 md:pb-10"
      )}
    >
      {index % 4 < 2 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
      )}
      {index % 4 >= 2 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      )}
      <div className="mb-4 md:mb-5 relative z-10 px-5 md:px-8 lg:px-10 text-white">
        <div className="scale-110 md:scale-125">
          {icon}
        </div>
      </div>
      <div className="text-xl md:text-2xl lg:text-3xl font-medium mb-3 md:mb-4 relative z-10 px-5 md:px-8 lg:px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-7 w-[3px] bg-purple-500/80 group-hover/feature:bg-purple-400 transition-all duration-300 origin-center rounded-full" />
        <span className="group-hover/feature:translate-x-1 transition duration-300 inline-block text-white font-space tracking-tight leading-relaxed">
          {title}
        </span>
      </div>
      <p className="text-sm md:text-base lg:text-lg text-white/95 max-w-sm md:max-w-md relative z-10 px-5 md:px-8 lg:px-10 font-normal leading-relaxed">
        {description}
      </p>
    </div>
  );
};

