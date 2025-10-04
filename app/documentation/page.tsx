export default function DocumentationPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold">Documentation</h1>
      <p className="mt-2 text-slate-300">Guides to help you get the most out of DoorIQ.</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Getting Started</h2>
        <p className="mt-2 text-slate-300">
          Create an account, choose a homeowner persona, and run your first training session.
        </p>
        <ul className="mt-4 list-disc list-inside text-slate-300 space-y-1">
          <li>Sign up and invite teammates</li>
          <li>Set up practice scenarios</li>
          <li>Review analytics and feedback</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">API Reference</h2>
        <p className="mt-2 text-slate-300">
          Use our APIs to retrieve session data, transcripts, and analytics for deeper reporting.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Realtime Voice & Training</h2>
        <p className="mt-2 text-slate-300">
          Learn how realtime voice sessions work, best practices for mic setup, and how to
          incorporate feedback into your team's coaching loop.
        </p>
      </section>
    </div>
  );
}


