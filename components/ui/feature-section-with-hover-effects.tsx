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
        "Practice with hyper-realistic AI homeowners that adapt to your pitch and throw real objections.",
      icon: <Bot className="w-5 h-5" />,
    },
    {
      title: "Real-time Feedback",
      description:
        "Get instant coaching on tone, pacing, and persuasion techniques as you practice.",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      title: "Performance Analytics",
      description:
        "Deep insights into every rep's strengths, weaknesses, and improvement trajectory.",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: "Objection Handling",
      description:
        "Master the toughest objections with AI-powered scenarios that prepare reps for anything.",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      title: "Team Leaderboards",
      description:
        "Drive healthy competition with gamified rankings that motivate your team.",
      icon: <Trophy className="w-5 h-5" />,
    },
    {
      title: "Manager Insights",
      description:
        "See exactly where each rep needs coaching without sitting in on calls.",
      icon: <LineChart className="w-5 h-5" />,
    },
    {
      title: "Lightning Fast Setup",
      description:
        "Get your team onboarded and practicing in under 10 minutes.",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      title: "Unlimited Practice",
      description:
        "No caps, no limits. Your reps train as much as they need to become closers.",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  const featuresToRender = features || defaultFeatures;

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-0 relative z-10 pt-6 pb-6 md:pb-8 max-w-5xl mx-auto">
      {featuresToRender.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} totalFeatures={featuresToRender.length} />
      ))}
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
  return (
    <div
      className={cn(
        "flex flex-col border-r-[2px] md:border-r-[2px] py-4 md:py-6 relative group/feature border-white/20",
        (index % 2 === 0) && "border-l-[2px] md:border-l-[2px] border-white/20",
        (index < totalFeatures - 2) && "border-b-[2px] md:border-b-[2px] border-white/20",
        // Add bottom border to last 2 features on mobile
        (index >= totalFeatures - 2) && "border-b-[2px] md:border-b-[2px] border-white/20 pb-6 md:pb-8",
        (index < 2) && "border-t-[2px] md:border-t-[2px] border-white/20"
      )}
    >
      {index % 2 === 0 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
      )}
      {index % 2 === 1 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      )}
      <div className="mb-3 relative z-10 px-4 md:px-8 text-white">
        {icon}
      </div>
      <div className="text-xl md:text-2xl font-medium mb-2 relative z-10 px-4 md:px-8">
        <div className="absolute left-0 inset-y-0 h-5 group-hover/feature:h-6 w-[3px] bg-purple-500/80 group-hover/feature:bg-purple-400 transition-all duration-300 origin-center rounded-full" />
        <span className="group-hover/feature:translate-x-1 transition duration-300 inline-block text-white font-space tracking-tight leading-relaxed">
          {title}
        </span>
      </div>
      <p className="text-base md:text-lg text-white/95 max-w-xs relative z-10 px-4 md:px-8 font-normal leading-relaxed">
        {description}
      </p>
    </div>
  );
};

