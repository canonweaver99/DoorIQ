'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PracticePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new trainer page
    router.push('/trainer');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting to trainer...</p>
      </div>
    </div>
  );
}