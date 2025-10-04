export default function PrivacyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-slate-300">Last updated: {new Date().getFullYear()}</p>

      <section className="mt-8 space-y-4 text-slate-300">
        <p>
          We collect data to power training sessions, analytics, and your team's coaching workflows. This includes audio captured during
          practice sessions, transcripts, and performance metrics that help you improve.
        </p>
        <p>
          We do not sell your data. Access is restricted to authorized team members and administrators.
        </p>
        <p>
          For questions or data requests, contact us at hello@dooriq.com.
        </p>
      </section>
    </div>
  )
}


