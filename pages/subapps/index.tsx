import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import type { SubApp } from '@/types/subapp';

export default function SubApps() {
  const [subapps, setSubapps] = useState<SubApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubapps = async () => {
      try {
        const q = query(collection(db, 'subapps'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const subappsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SubApp[];
        setSubapps(subappsList);
      } catch (error) {
        console.error('Error fetching subapps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubapps();
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Sub-apps</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subapps.map((subapp) => (
          <Link
            key={subapp.id}
            href={`/subapps/${subapp.slug}`}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900">{subapp.name}</h2>
            <p className="mt-2 text-gray-600">{subapp.description}</p>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <span>{subapp.memberCount} members</span>
              {!subapp.isPublic && (
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