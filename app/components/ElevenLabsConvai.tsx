"use client";

import React, { useEffect } from "react";

export default function ElevenLabsConvai({
  agentId,
  mode = "embedded",
  theme = "dark",
  startOpen = true
}: {
  agentId: string;
  mode?: "embedded" | "floating";
  theme?: "light" | "dark" | "system";
  startOpen?: boolean;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("elevenlabs-convai-script")) return;
    
    const s = document.createElement("script");
    s.id = "elevenlabs-convai-script";
    s.src = "https://elevenlabs.io/convai-widget/index.js";
    s.defer = true;
    document.head.appendChild(s);
    
    return () => {
      // Keep script loaded across navigations for better performance
    };
  }, []);

  // Note: pass strings to custom-element attributes
  // Use React.createElement to bypass TypeScript JSX typing issues
  return React.createElement('elevenlabs-convai', {
    'agent-id': String(agentId),
    mode: String(mode),
    theme: String(theme),
    'start-open': startOpen ? "true" : undefined
  });
}
