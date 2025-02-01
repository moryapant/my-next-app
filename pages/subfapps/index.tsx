import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import type { SubFapp } from '@/types/subfapp';

export default function SubFapps() {
  const [subfapps, setSubfapps] = useState<SubFapp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubfapps = async () => {
      try {
        const q = query(collection(db, 'subfapps'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const subfappsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SubFapp[];
        setSubfapps(subfappsList);
      } catch (error) {
        console.error('Error fetching subfapps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubfapps();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Subfapps</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subfapps.map((subfapp) => (
          <Link
            key={subfapp.id}
            href={`/subfapps/${subfapp.slug}`}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900">{subfapp.name}</h2>
            <p className="mt-2 text-gray-600">{subfapp.description}</p>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span>{subfapp.memberCount} members</span>
              {!subfapp.isPublic && (
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs">
                  Private
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 