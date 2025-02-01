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
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create a New Subfapp</h1>
      <CreateSubFappForm />
    </div>
  );
} 