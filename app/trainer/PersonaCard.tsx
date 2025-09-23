'use client';

export default function PersonaCard({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 shadow-xl p-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
          )}
        </div>
        <div>
          <div className="text-white text-lg font-semibold">{name}</div>
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-600/30">Safety-first</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-600/20 text-blue-300 border border-blue-600/30">Quick replies</span>
          </div>
        </div>
      </div>
    </div>
  );
}


