import { PricingSection } from "@/components/ui/pricing";

const demoPlans = [
  {
    name: "Starter",
    price: "15",
    yearlyPrice: "12",
    period: "month",
    features: [
      "Access to 1 AI training agent",
      "Up to 25 practice calls/month",
      "Basic performance analytics",
      "Email support",
      "Standard response templates",
      "Basic objection handling scenarios",
    ],
    description: "Perfect for individual sales reps",
    buttonText: "Start Free Trial",
    href: "#",
  },
  {
    name: "Professional",
    price: "50",
    yearlyPrice: "40",
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
      "Up to 5 team members",
    ],
    description: "Ideal for small sales teams",
    buttonText: "Get Started",
    href: "#",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "399",
    yearlyPrice: "319",
    period: "month",
    features: [
      "Everything in Professional",
      "Custom knowledge base upload",
      "Train AI grader with company data",
      "Up to 50 sales reps",
      "Up to 3 managers with admin access",
      "Custom AI agent configuration",
      "Advanced team analytics & leaderboards",
      "Role-based access control",
      "Dedicated success manager",
      "Custom onboarding & training",
      "SLA guarantee",
      "SSO/SAML authentication",
    ],
    description: "For large sales organizations",
    buttonText: "Contact Sales",
    href: "#",
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


