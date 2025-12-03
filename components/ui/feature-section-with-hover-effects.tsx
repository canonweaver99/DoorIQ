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
      icon: <Bot className="w-6 h-6" />,
    },
    {
      title: "Real-time Feedback",
      description:
        "Get instant coaching on tone, pacing, and persuasion techniques as you practice.",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      title: "Performance Analytics",
      description:
        "Deep insights into every rep's strengths, weaknesses, and improvement trajectory.",
      icon: <BarChart3 className="w-6 h-6" />,
    },
    {
      title: "Objection Handling",
      description:
        "Master the toughest objections with AI-powered scenarios that prepare reps for anything.",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      title: "Team Leaderboards",
      description:
        "Drive healthy competition with gamified rankings that motivate your team.",
      icon: <Trophy className="w-6 h-6" />,
    },
    {
      title: "Manager Insights",
      description:
        "See exactly where each rep needs coaching without sitting in on calls.",
      icon: <LineChart className="w-6 h-6" />,
    },
    {
      title: "Lightning Fast Setup",
      description:
        "Get your team onboarded and practicing in under 10 minutes.",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: "Unlimited Practice",
      description:
        "No caps, no limits. Your reps train as much as they need to become closers.",
      icon: <Users className="w-6 h-6" />,
    },
  ];

  const featuresToRender = features || defaultFeatures;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 pt-8 pb-12 max-w-7xl mx-auto">
      {featuresToRender.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r-[2px] py-8 md:py-10 relative group/feature border-white/20",
        (index === 0 || index === 4) && "lg:border-l-[2px] border-white/20",
        index < 4 && "lg:border-b-[2px] border-white/20",
        index < 4 && "lg:border-t-[2px] border-white/20",
        index >= 4 && "lg:border-b-[2px] border-white/20"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-white/[0.02] to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-white">
        {icon}
      </div>
      <div className="text-xl md:text-2xl font-medium mb-3 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-[3px] bg-purple-500/80 group-hover/feature:bg-purple-400 transition-all duration-300 origin-center rounded-full" />
        <span className="group-hover/feature:translate-x-1 transition duration-300 inline-block text-white font-space tracking-tight leading-relaxed">
          {title}
        </span>
      </div>
      <p className="text-base md:text-lg text-white/95 max-w-xs relative z-10 px-10 font-normal leading-loose">
        {description}
      </p>
    </div>
  );
};

