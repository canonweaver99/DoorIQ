import { Sidebar, SidebarBody } from "@/components/ui/sidebar";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar>
        <SidebarBody
          className="bg-[#05050c]/90 text-white"
          sidebar={
            <nav className="flex flex-col gap-4 text-sm font-medium">
              <div className="text-xs uppercase tracking-[0.35em] text-slate-400 mb-4">
                Training
              </div>
              <a href="/trainer" className="rounded-xl px-3 py-2 bg-white/10 text-white">
                Session
              </a>
              <a href="/trainer/select-homeowner" className="rounded-xl px-3 py-2 hover:bg-white/10 text-slate-200">
                Choose Homeowner
              </a>
              <a href="/trainer/history" className="rounded-xl px-3 py-2 hover:bg-white/10 text-slate-200">
                Session History
              </a>
              <a href="/trainer/leaderboard" className="rounded-xl px-3 py-2 hover:bg-white/10 text-slate-200">
                Leaderboard
              </a>
              <a href="/trainer/pre-session" className="rounded-xl px-3 py-2 hover:bg-white/10 text-slate-200">
                Coaching Tips
              </a>
            </nav>
          }
        >
          <div className="flex-1 min-h-screen overflow-hidden">
            {children}
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}
