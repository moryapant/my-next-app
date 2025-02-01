'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import type { SubFapp } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  images: string[];
  authorName: string;
  subfappName: string;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  votes: number;
  commentCount: number;
}

const formatDate = (timestamp: Post['createdAt']) => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Timestamp 
      ? timestamp.toDate()
      : new Date(timestamp.seconds * 1000);
  
  return date.toLocaleDateString();
};

export default function SubFappPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [subfapp, setSubfapp] = useState<SubFapp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');

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
          where('slug', '==', slug.toLowerCase())
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
            const isUserMember = !memberSnapshot.empty;
            setIsMember(isUserMember);

            // If user is a member, fetch posts
            if (isUserMember) {
              await fetchPosts(doc.id);
            }
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

  const fetchPosts = async (subfappId: string) => {
    setPostsLoading(true);
    setPostsError('');
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('subfappId', '==', subfappId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPostsError('Failed to load posts. Please try again later.');
    } finally {
      setPostsLoading(false);
    }
  };

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
          setPosts([]); // Clear posts when leaving
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
        // Fetch posts when joining
        await fetchPosts(subfapp.id);
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Posts</h2>
              {/* Add create post button here later */}
            </div>
            
            {postsError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{postsError}</p>
                <button
                  onClick={() => fetchPosts(subfapp.id)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Try Again
                </button>
              </div>
            ) : postsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Posted by {post.authorName}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <h3 className="text-xl font-semibold mt-2">{post.title}</h3>
                    <p className="mt-2 text-gray-700">{post.content}</p>
                    
                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                      <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mt-4`}>
                        {post.images.map((imageUrl, index) => (
                          <div key={index} className="relative aspect-video">
                            <img
                              src={imageUrl}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Post Footer */}
                    <div className="mt-4 flex items-center space-x-4 text-gray-500">
                      <div className="flex items-center space-x-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span>{post.votes}</span>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <button className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.commentCount} Comments</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No posts yet. Be the first to post!</p>
                {/* Add create first post button here later */}
              </div>
            )}
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