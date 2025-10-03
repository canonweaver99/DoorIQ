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
    price: "20",
    yearlyPrice: "16",
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
    price: "Contact Sales",
    yearlyPrice: "Contact Sales",
    period: "",
    features: [
      "Everything in Individual",
      "Team management dashboard",
      "Real-time team analytics & leaderboards",
      "Role-based access control",
      "Assign training to reps",
      "Track team performance metrics",
      "Manager coaching insights",
      "Bulk report exports",
      "Custom pricing based on team size",
      "Dedicated account manager",
    ],
    description: "For sales managers and teams",
    buttonText: "Contact Sales",
    href: "mailto:sales@dooriq.com",
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


