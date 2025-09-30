import { GlowCard } from "@/components/ui/spotlight-card";

export function Default() {
  return (
    <div className="w-screen h-screen flex flex-row items-center justify-center gap-10 bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <GlowCard glowColor="blue">
        <div className="flex flex-col items-center justify-center h-full">
          <h3 className="text-2xl font-bold text-white">Blue Glow</h3>
          <p className="text-slate-300 mt-2">Hover to see the effect</p>
        </div>
      </GlowCard>
      
      <GlowCard glowColor="purple">
        <div className="flex flex-col items-center justify-center h-full">
          <h3 className="text-2xl font-bold text-white">Purple Glow</h3>
          <p className="text-slate-300 mt-2">Move your mouse around</p>
        </div>
      </GlowCard>
      
      <GlowCard glowColor="green">
        <div className="flex flex-col items-center justify-center h-full">
          <h3 className="text-2xl font-bold text-white">Green Glow</h3>
          <p className="text-slate-300 mt-2">Interactive lighting</p>
        </div>
      </GlowCard>
    </div>
  );
}