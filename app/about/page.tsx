export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold">About DoorIQ</h1>
      <p className="mt-2 text-slate-300">
        We help door-to-door teams practice the hard conversations before they knock. Our AI homeowners push back,
        hesitate, and ask real questions so reps can build confidence and close more deals.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Our Mission</h2>
        <p className="mt-2 text-slate-300">
          Deliver realistic training reps love, and analytics managers trust.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">What We're Building</h2>
        <ul className="mt-2 list-disc list-inside text-slate-300 space-y-1">
          <li>Lifelike voice conversations with AI homeowners</li>
          <li>Instant feedback and objective scoring</li>
          <li>Leaderboards, coaching loops, and progress tracking</li>
        </ul>
      </section>
    </div>
  )
}


