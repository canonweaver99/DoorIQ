"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/navigation/Header";
import { Suspense } from "react";

export function ConditionalHeader() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/landing";
  const isLandingPricingPage = pathname === "/landing/pricing";
  const isFeedbackPage = pathname?.startsWith("/trainer/feedback/");
  const isGradingPage = pathname?.startsWith("/trainer/loading/");
  const isTrainerPage = pathname === "/trainer";
  const isOnboardingPage = pathname?.startsWith("/onboarding");

  if (isLandingPage || isLandingPricingPage || isFeedbackPage || isGradingPage || isTrainerPage || isOnboardingPage) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Header />
    </Suspense>
  );
}


