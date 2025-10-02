'use client'

import { PricingSection } from "@/components/ui/pricing";

const demoPlans = [
  {
    name: "Free",
    price: "0",
    yearlyPrice: "0",
    period: "month",
    features: [
      "Access to 3 AI training agents",
      "Up to 10 practice calls/month",
      "Basic performance analytics",
      "Email support",
      "Standard response templates",
      "Basic objection handling scenarios",
    ],
    description: "Perfect for getting started",
    buttonText: "Get Started Free",
    href: "/auth/signup",
  },
  {
    name: "Individual",
    price: "35",
    yearlyPrice: "28",
    period: "month",
    features: [
      "Access to ALL AI training agents",
      "Unlimited practice calls",
      "Advanced analytics & scoring",
      "Real-time feedback & coaching",
      "Custom sales scenarios",
      "Call recording & playback",
      "Performance tracking dashboard",
      "Priority email & chat support",
      "Export reports (CSV/PDF)",
    ],
    description: "Ideal for individual sales reps",
    buttonText: "Get Started",
    href: "/auth/signup",
    isPopular: true,
  },
  {
    name: "Manager",
    price: "120",
    yearlyPrice: "96",
    period: "month",
    features: [
      "Everything in Individual",
      "Team management dashboard",
      "Real-time team analytics & leaderboards",
      "Role-based access control",
      "Assign training to reps",
      "Track team performance metrics",
      "Manager coaching insights",
      "Bulk report exports",
      "Minimum 3 reps included ($15/month each)",
      "Add unlimited additional reps at $15/month",
    ],
    description: "For sales managers and teams",
    buttonText: "Get Started",
    href: "/auth/signup",
    hasRepSelector: true,
    basePrice: 75,
    yearlyBasePrice: 60,
    repPrice: 15,
    yearlyRepPrice: 12,
    minReps: 3,
  },
];

export default function PricingPage() {
  return (
    <PricingSection
      plans={demoPlans}
      title="Find the Perfect Plan"
      description="Choose the plan that fits your sales team's needs and start mastering door-to-door sales today."
    />
  );
}


