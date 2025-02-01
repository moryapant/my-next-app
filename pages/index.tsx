import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-gray-900">
              {user ? `Welcome, ${user.displayName}!` : 'Welcome to the Blog App!'}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
} 