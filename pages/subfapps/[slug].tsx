import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import type { SubFapp } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function SubFappPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subfapp, setSubfapp] = useState<SubFapp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    async function fetchSubfapp() {
      if (!router.isReady) return;
      
      const { slug } = router.query;
      if (!slug || typeof slug !== 'string') {
        setError('Invalid subfapp URL');
        setLoading(false);
        return;
      }

      try {
        // Query by slug instead of ID
        const q = query(
          collection(db, 'subfapps'),
          where('slug', '==', slug)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setSubfapp({
            id: doc.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            imageUrl: data.imageUrl,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            isPublic: data.isPublic,
            memberCount: data.memberCount || 0,
          });

          // Check if user is a member
          if (user) {
            const membersQuery = query(
              collection(db, 'subfapps', doc.id, 'members'),
              where('userId', '==', user.uid)
            );
            const memberSnapshot = await getDocs(membersQuery);
            setIsMember(!memberSnapshot.empty);
          }
        } else {
          setError('Subfapp not found');
        }
      } catch (err) {
        console.error('Error fetching subfapp:', err);
        setError('Failed to load subfapp');
      } finally {
        setLoading(false);
      }
    }

    fetchSubfapp();
  }, [router.isReady, router.query, user]);

  const handleJoinLeave = async () => {
    if (!user || !subfapp) return;
    
    setJoinLoading(true);
    try {
      if (isMember) {
        // Leave subfapp
        const membersQuery = query(
          collection(db, 'subfapps', subfapp.id, 'members'),
          where('userId', '==', user.uid)
        );
        const memberSnapshot = await getDocs(membersQuery);
        if (!memberSnapshot.empty) {
          await deleteDoc(memberSnapshot.docs[0].ref);
          setIsMember(false);
          setSubfapp(prev => prev ? {...prev, memberCount: prev.memberCount - 1} : null);
        }
      } else {
        // Join subfapp
        await addDoc(collection(db, 'subfapps', subfapp.id, 'members'), {
          userId: user.uid,
          role: 'member',
          joinedAt: serverTimestamp(),
        });
        setIsMember(true);
        setSubfapp(prev => prev ? {...prev, memberCount: prev.memberCount + 1} : null);
      }
    } catch (err) {
      console.error('Error updating membership:', err);
    } finally {
      setJoinLoading(false);
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

  if (error || !subfapp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">{error}</h1>
          <button
            onClick={() => router.push('/subfapps')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Back to Subfapps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-64 md:h-96 w-full">
        {subfapp.imageUrl ? (
          <Image
            src={subfapp.imageUrl}
            alt={subfapp.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">{subfapp.name}</h1>
            <p className="text-lg opacity-90">{subfapp.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
                onClick={handleJoinLeave}
                disabled={joinLoading}
                className={`px-4 py-2 rounded-md font-medium ${
                  isMember
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-50`}
              >
                {joinLoading ? 'Loading...' : isMember ? 'Leave' : 'Join'}
              </button>
            )}
          </div>
        </div>

        {/* Posts Section - Only visible to members */}
        {isMember ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Posts</h2>
            {/* Add posts component here */}
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-medium mb-2">Join to see posts</h2>
            <p className="text-gray-500">
              {subfapp.isPublic 
                ? 'Join this subfapp to see and create posts'
                : 'This is a private subfapp. Join to see and create posts'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 