import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import CreateSubFappForm from '@/components/CreateSubFappForm';
import { useEffect } from 'react';

export default function CreateSubFapp() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a New Subfapp</h1>
          <p className="mt-2 text-gray-600">Set up your community and start sharing</p>
        </div>
        <CreateSubFappForm />
      </div>
    </div>
  );
} 