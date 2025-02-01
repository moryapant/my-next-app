import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateSubAppForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const docRef = await addDoc(collection(db, 'subapps'), {
        name: formData.name,
        description: formData.description,
        slug,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        memberCount: 1,
        isPublic: formData.isPublic,
      });

      // Add creator as first member
      await addDoc(collection(db, 'subapps', docRef.id, 'members'), {
        userId: user.uid,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      router.push(`/subapps/${slug}`);
    } catch (err) {
      setError('Failed to create sub-app. Please try again.');
      console.error('Error creating sub-app:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
          Make this sub-app public
        </label>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Sub-app'}
      </button>
    </form>
  );
} 