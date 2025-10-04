export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold">Help Center</h1>
      <p className="mt-2 text-slate-300">Troubleshooting tips and contact options.</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Common fixes</h2>
        <ul className="mt-4 list-disc list-inside text-slate-300 space-y-1">
          <li>Use a headset mic and check browser mic permissions</li>
          <li>Ensure a stable internet connection for realtime voice</li>
          <li>Try a private window to isolate extension conflicts</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Contact Support</h2>
        <p className="mt-2 text-slate-300">Email us at hello@dooriq.com for assistance.</p>
      </section>
    </div>
  )
}


