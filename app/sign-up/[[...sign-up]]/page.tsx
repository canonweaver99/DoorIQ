import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Join DoorIQ</h1>
        <p className="text-gray-400 mb-8">Create your account to start training</p>
        <SignUp />
      </div>
    </div>
  );
}
