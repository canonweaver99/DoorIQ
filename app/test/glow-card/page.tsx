'use client'

import { GlowCard } from "@/components/ui/spotlight-card";

export default function GlowCardDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-12">
          GlowCard Component Demo
        </h1>
        
        {/* Default sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Default Sizes</h2>
          <div className="flex flex-wrap gap-8 justify-center">
            <GlowCard size="sm" glowColor="blue">
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-xl font-bold text-white">Small</h3>
                <p className="text-slate-300 text-sm mt-2">Blue Glow</p>
              </div>
            </GlowCard>
            
            <GlowCard size="md" glowColor="purple">
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-xl font-bold text-white">Medium</h3>
                <p className="text-slate-300 text-sm mt-2">Purple Glow</p>
              </div>
            </GlowCard>
            
            <GlowCard size="lg" glowColor="green">
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-xl font-bold text-white">Large</h3>
                <p className="text-slate-300 text-sm mt-2">Green Glow</p>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* Different colors */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Color Variations</h2>
          <div className="flex flex-wrap gap-8 justify-center">
            <GlowCard glowColor="blue">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-blue-500 mb-4"></div>
                <h3 className="text-lg font-bold text-white">Blue</h3>
              </div>
            </GlowCard>
            
            <GlowCard glowColor="purple">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-purple-500 mb-4"></div>
                <h3 className="text-lg font-bold text-white">Purple</h3>
              </div>
            </GlowCard>
            
            <GlowCard glowColor="green">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-green-500 mb-4"></div>
                <h3 className="text-lg font-bold text-white">Green</h3>
              </div>
            </GlowCard>
            
            <GlowCard glowColor="red">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-red-500 mb-4"></div>
                <h3 className="text-lg font-bold text-white">Red</h3>
              </div>
            </GlowCard>
            
            <GlowCard glowColor="orange">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-orange-500 mb-4"></div>
                <h3 className="text-lg font-bold text-white">Orange</h3>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* Custom sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Custom Sizes</h2>
          <div className="flex flex-wrap gap-8 justify-center items-stretch">
            <GlowCard 
              customSize 
              glowColor="purple"
              className="w-80 h-40"
            >
              <div className="flex items-center justify-center h-full">
                <h3 className="text-lg font-bold text-white">Wide Card</h3>
              </div>
            </GlowCard>
            
            <GlowCard 
              customSize 
              glowColor="blue"
              className="w-96 h-52"
            >
              <div className="flex flex-col items-center justify-center h-full p-6">
                <h3 className="text-xl font-bold text-white mb-2">Content Card</h3>
                <p className="text-slate-300 text-sm text-center">
                  This card can contain any content you want with custom dimensions
                </p>
              </div>
            </GlowCard>
          </div>
        </section>

        {/* Practical use cases */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Practical Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlowCard customSize glowColor="blue" className="h-full">
              <div className="flex flex-col h-full p-6">
                <h3 className="text-xl font-semibold text-slate-100">Feature Card</h3>
                <p className="mt-3 text-slate-300 flex-grow">
                  Interactive spotlight effect that follows your mouse cursor across the page
                </p>
                <div className="mt-4 text-blue-400 font-semibold">Learn More →</div>
              </div>
            </GlowCard>
            
            <GlowCard customSize glowColor="purple" className="h-full">
              <div className="flex flex-col h-full p-6 text-center">
                <div className="text-5xl font-bold text-slate-100 mb-2">42%</div>
                <p className="text-slate-300 flex-grow">
                  Improvement in engagement with interactive UI elements
                </p>
              </div>
            </GlowCard>
            
            <GlowCard customSize glowColor="green" className="h-full">
              <div className="flex flex-col h-full p-6">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-slate-100">Goal Tracking</h3>
                <p className="mt-3 text-slate-300 flex-grow">
                  Monitor your progress with beautiful, interactive cards
                </p>
              </div>
            </GlowCard>
          </div>
        </section>

        <div className="mt-12 text-center text-slate-400">
          <p>Move your mouse around to see the spotlight effect!</p>
        </div>
      </div>
    </div>
  );
}
