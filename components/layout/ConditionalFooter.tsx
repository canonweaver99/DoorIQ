"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/ui/footer-section";

export function ConditionalFooter() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/landing";
  const isOnboardingPage = pathname?.startsWith("/onboarding");

  if (isLandingPage || isOnboardingPage) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-10 bg-[#0a0a0a]">
      <Footer />
    </div>
  );
}


