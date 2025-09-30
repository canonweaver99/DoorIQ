"use client";

import * as React from "react";
import { Banner } from "@/components/ui/banner";
import { cn } from "@/lib/utils";
import { ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BannerDemoPage() {
  const [show, setShow] = React.useState(true);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-6">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-1/3 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full",
          "bg-[radial-gradient(ellipse_at_center,var(--tw-ring-color,rgba(255,255,255,0.08)),transparent_50%)]",
          "blur-[30px]",
        )}
      />
      <div className="max-w-3xl w-full">
        <Banner
          show={show}
          onHide={() => setShow(false)}
          variant="default"
          title="AI Dashboard is here!"
          description="Experience the future of analytics"
          showShade
          closable
          icon={<Rocket />}
          action={
            <Button onClick={() => setShow(false)} variant="ghost" className="inline-flex items-center gap-1">
              Try now
              <ArrowRight className="h-3 w-3" />
            </Button>
          }
        />
      </div>
    </div>
  );
}


