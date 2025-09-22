"use client";
import { useEffect } from "react";

export default function ElevenLabsConvai({
  agentId,
  mode = "embedded",
  theme = "dark"
}: {
  agentId: string;
  mode?: "embedded" | "floating";
  theme?: "light" | "dark" | "system";
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("elevenlabs-convai-script")) return;
    
    const s = document.createElement("script");
    s.id = "elevenlabs-convai-script";
    s.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    s.async = true;
    s.type = "text/javascript";
    document.head.appendChild(s);
    
    return () => {
      // Keep script loaded across navigations for better performance
    };
  }, []);

  // All attributes on custom elements must be strings
  return (
    <elevenlabs-convai 
      agent-id={agentId} 
      mode={mode}
      theme={theme}
      start-open="true"
    />
  );
}
