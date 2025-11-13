export default function TeamPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold">Team</h1>
      <p className="mt-2 text-slate-300">Manage team members and roles.</p>

      <div className="mt-6">
        <a
          href="/team/invite"
          className="inline-flex items-center rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow hover:from-purple-600 hover:to-pink-600"
        >
          Invite a Sales Rep
        </a>
      </div>
    </div>
  )
}


