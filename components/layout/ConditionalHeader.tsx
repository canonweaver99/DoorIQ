"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/navigation/Header";
import { Suspense } from "react";

export function ConditionalHeader() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/landing";

  if (isLandingPage) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Header />
    </Suspense>
  );
}


