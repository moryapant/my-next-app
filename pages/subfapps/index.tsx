import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, where, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import type { SubFapp } from '@/types/subfapp';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface SubFappWithMembership extends SubFapp {
  isMember?: boolean;
}

export default function SubFapps() {
  const { user } = useAuth();
  const [subfapps, setSubfapps] = useState<SubFappWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubfapps = async () => {
      try {
        // Fetch all subfapps
        const q = query(collection(db, 'subfapps'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const subfappsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SubFappWithMembership[];

        // If user is logged in, fetch their memberships
        if (user) {
          const membershipPromises = subfappsList.map(async (subfapp) => {
            const membersQuery = query(
              collection(db, 'subfapps', subfapp.id, 'members'),
              where('userId', '==', user.uid)
            );
            const memberSnapshot = await getDocs(membersQuery);
            return !memberSnapshot.empty;
          });

          const memberships = await Promise.all(membershipPromises);
          subfappsList.forEach((subfapp, index) => {
            subfapp.isMember = memberships[index];
          });
        }

        setSubfapps(subfappsList);
      } catch (error) {
        console.error('Error fetching subfapps:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubfapps();
  }, [user]);

  const handleJoinLeave = async (e: React.MouseEvent, subfapp: SubFappWithMembership) => {
    e.preventDefault(); // Prevent navigation
    if (!user) return;

    setJoinLoading(subfapp.id);
    try {
      if (subfapp.isMember) {
        // Leave subfapp
        const membersQuery = query(
          collection(db, 'subfapps', subfapp.id, 'members'),
          where('userId', '==', user.uid)
        );
        const memberSnapshot = await getDocs(membersQuery);
        if (!memberSnapshot.empty) {
          await deleteDoc(memberSnapshot.docs[0].ref);
          setSubfapps(prev => prev.map(s => 
            s.id === subfapp.id 
              ? { ...s, isMember: false, memberCount: s.memberCount - 1 }
              : s
          ));
        }
      } else {
        // Join subfapp
        await addDoc(collection(db, 'subfapps', subfapp.id, 'members'), {
          userId: user.uid,
          role: 'member',
          joinedAt: serverTimestamp(),
        });
        setSubfapps(prev => prev.map(s => 
          s.id === subfapp.id 
            ? { ...s, isMember: true, memberCount: s.memberCount + 1 }
            : s
        ));
      }
    } catch (err) {
      console.error('Error updating membership:', err);
    } finally {
      setJoinLoading(null);
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Subfapps</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subfapps.map((subfapp) => (
          <div key={subfapp.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
            {subfapp.imageUrl && (
              <div className="relative h-48 w-full">
                <Image
                  src={subfapp.imageUrl}
                  alt={subfapp.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <Link
                href={`/subfapps/${subfapp.slug}`}
                className="block"
              >
                <h2 className="text-xl font-semibold text-gray-900 hover:text-indigo-600">{subfapp.name}</h2>
                <p className="mt-2 text-gray-600">{subfapp.description}</p>
              </Link>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {subfapp.memberCount} {subfapp.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  {!subfapp.isPublic && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      Private
                    </span>
                  )}
                </div>
                {user && (
                  <button
                    onClick={(e) => handleJoinLeave(e, subfapp)}
                    disabled={joinLoading === subfapp.id}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      subfapp.isMember
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    } disabled:opacity-50`}
                  >
                    {joinLoading === subfapp.id ? 'Loading...' : subfapp.isMember ? 'Leave' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 