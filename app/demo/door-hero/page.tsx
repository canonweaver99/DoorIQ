import { ShaderAnimation } from "@/components/ui/shader-lines";

export default function DemoOne() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Full-bleed shader background */}
      <ShaderAnimation />
      {/* Centered title */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="pointer-events-none z-10 text-center text-7xl leading-none font-semibold tracking-tighter whitespace-pre-wrap text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)]">
          Shader Lines
        </span>
      </div>
    </div>
  )
}


