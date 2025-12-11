"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/navigation/Header";
import { Suspense } from "react";

export function ConditionalHeader() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/landing";
  const isFeedbackPage = pathname?.startsWith("/trainer/feedback/");
  const isGradingPage = pathname?.startsWith("/trainer/loading/");
  const isTrainerPage = pathname === "/trainer";

  if (isLandingPage || isFeedbackPage || isGradingPage || isTrainerPage) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Header />
    </Suspense>
  );
}


