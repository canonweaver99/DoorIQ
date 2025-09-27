import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 1) Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-100 mb-6">
              Train Like the Top 1% — Before You Knock.
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
              DoorIQ turns real door-to-door moments into safe, repeatable reps. Talk to a lifelike AI homeowner, get instant feedback, and watch your close rate climb.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/trainer?autostart=1"
                className="inline-flex items-center px-7 py-4 rounded-lg bg-white text-slate-900 font-semibold shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition"
              >
                Try a Free Practice Session
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center px-7 py-4 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700/70 transition"
              >
                Watch 30-sec Demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400">Powered by enterprise-grade speech + realtime AI.</p>
          </div>
        </div>

        {/* soft blobs */}
        <div className="pointer-events-none absolute top-0 left-0 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-indigo-600 rounded-full filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* 2) Social Proof */}
      <section className="py-16">
        <h3 className="text-center text-sm uppercase tracking-wider text-slate-400">
          Trusted by High-Performing Sales Teams
        </h3>
        <p className="text-center text-slate-400 mt-2">
          From solo reps to national crews — teams level up faster on DoorIQ.
        </p>

        <div className="mt-8 overflow-hidden relative">
          {/* gradient fades left/right */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900 to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-900 to-transparent"></div>

          {/* marquee container */}
          <div className="logo-marquee" aria-hidden="true">
            <div className="logo-track">
              <img src="/logos/greenshield.svg" alt="GreenShield" />
              <img src="/logos/clearline.svg" alt="ClearLine" />
              <img src="/logos/primepest.svg" alt="PrimePest" />
              <img src="/logos/hawkeye.svg" alt="HawkEye" />
              <img src="/logos/northstar.svg" alt="NorthStar" />
              <img src="/logos/atlas.svg" alt="Atlas" />
            </div>
            <div className="logo-track" aria-hidden="true">
              <img src="/logos/greenshield.svg" alt="" />
              <img src="/logos/clearline.svg" alt="" />
              <img src="/logos/primepest.svg" alt="" />
              <img src="/logos/hawkeye.svg" alt="" />
              <img src="/logos/northstar.svg" alt="" />
              <img src="/logos/atlas.svg" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* 3) How It Works (3 steps) */}
      <section className="py-20 bg-slate-800/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-100 text-center">Your New Training Loop</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <HowCard
              title="Talk to Austin"
              body="Have real voice conversations with an AI homeowner who interrupts, hesitates, and pushes back like the real world."
            />
            <HowCard
              title="Get Instant Feedback"
              body="Objective scoring on tone, pace, discovery, and objection handling — with concrete next steps."
            />
            <HowCard
              title="Track Progress"
              body="See your trendlines by rep and team. Turn weak spots into muscle memory in days, not months."
            />
          </div>
        </div>
      </section>

      {/* 4) Results / ROI */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-100 text-center">Numbers That Move the Leaderboard</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard value="+27%" label="average improvement in close-rate after five sessions" />
            <StatCard value="40%" label="less manager time spent on live shadowing" />
            <StatCard value="2×" label="faster ramp for new reps" />
            <StatCard value="< 10 min" label="to run a high-impact practice session" />
          </div>
          <p className="text-center text-slate-300 mt-10 max-w-3xl mx-auto">
            Give your team the reps that actually matter — the hard ones.
          </p>
        </div>
      </section>

      {/* 5) Emotional Story */}
      <section className="py-20 bg-slate-800/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-100">From Slammed Doors to Second Chances</h2>
          <p className="mt-6 text-lg text-slate-300">
            Every rep remembers that first brush-off. The awkward pause. The rush to recover. DoorIQ turns those moments into a safe arena to practice under pressure — real voices, real emotions, real objections — until confidence feels automatic.
          </p>
          <p className="mt-4 text-lg text-slate-300">Train the nerves. Keep the edge. Win the door.</p>
        </div>
      </section>

      {/* Demo anchor placeholder */}
      <section id="demo" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-video w-full rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            30-sec demo coming soon
          </div>
        </div>
      </section>
    </div>
  );
}

function HowCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-3 text-slate-300">{body}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
      <div className="text-4xl font-bold text-slate-100">{value}</div>
      <div className="mt-2 text-slate-300 text-sm">{label}</div>
    </div>
  );
}