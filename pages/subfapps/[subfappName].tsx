import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PostList from '@/components/PostList';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import SubfappBanner from '@/components/SubfappBanner';

interface SubFapp {
    id: string;
    name: string;
    description: string;
    slug: string;
    imageUrl?: string;
    bannerUrl?: string;
    memberCount: number;
    createdAt: { seconds: number; nanoseconds: number };
    creatorId: string;
}

export default function SubFappPage() {
    const router = useRouter();
    const { subfappName } = router.query;
    const [subfapp, setSubfapp] = useState<SubFapp | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchSubFapp = async () => {
            if (!subfappName || typeof subfappName !== 'string') {
                return;
            }

            try {
                const subfappsRef = collection(db, 'subfapps');
                const q = query(
                    subfappsRef,
                    where('slug', '==', subfappName.toLowerCase())
                );
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    setError('SubFapp not found');
                    setLoading(false);
                    return;
                }

                const doc = querySnapshot.docs[0];
                const data = doc.data();
                
                // Debug the data we're getting from Firestore
                console.log('Fetched Subfapp Data:', {
                    id: doc.id,
                    creatorId: data.creatorId,
                    createdBy: data.createdBy, // Check if this exists instead
                    data: data
                });

                setSubfapp({
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    slug: data.slug,
                    imageUrl: data.imageUrl,
                    bannerUrl: data.bannerUrl,
                    memberCount: data.memberCount || 0,
                    createdAt: data.createdAt,
                    // Use creatorId if it exists, fall back to createdBy for older documents
                    creatorId: data.creatorId || data.createdBy,
                });

                // Check if user is a member
                if (user) {
                    const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
                    if (!userSnap.empty) {
                        const userData = userSnap.docs[0].data();
                        setIsJoined(userData.joinedSubfapps?.includes(doc.id) || false);
                    }
                }
            } catch (err) {
                console.error('Error fetching subfapp:', err);
                setError('Failed to load subfapp');
            } finally {
                setLoading(false);
            }
        };

        fetchSubFapp();
    }, [subfappName, user]);

    const handleJoinToggle = async () => {
        if (!user || !subfapp) return;
        
        setJoinLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            const subfappRef = doc(db, 'subfapps', subfapp.id);

            // Update user's joined subfapps
            await updateDoc(userRef, {
                joinedSubfapps: isJoined ? arrayRemove(subfapp.id) : arrayUnion(subfapp.id)
            });

            // Update subfapp's member count
            await updateDoc(subfappRef, {
                memberCount: isJoined ? subfapp.memberCount - 1 : subfapp.memberCount + 1
            });

            setIsJoined(!isJoined);
            setSubfapp(prev => prev ? {
                ...prev,
                memberCount: isJoined ? prev.memberCount - 1 : prev.memberCount + 1
            } : null);
        } catch (err) {
            console.error('Error toggling join status:', err);
        } finally {
            setJoinLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12">
                <div className="max-w-[1000px] mx-auto flex gap-6 px-4">
                    <div className="flex-1 min-w-0 flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !subfapp) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12">
                <div className="max-w-[1000px] mx-auto flex gap-6 px-4">
                    <div className="flex-1 min-w-0">
                        <div className="text-center text-red-500 py-8">
                            {error || 'SubFapp not found'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Banner Section */}
            <SubfappBanner
                subfappId={subfapp.id}
                creatorId={subfapp.creatorId}
                bannerUrl={subfapp.bannerUrl}
                onBannerUpdate={(newUrl) => {
                    setSubfapp(prev => prev ? { ...prev, bannerUrl: newUrl } : null);
                }}
            />

            {/* Content Section */}
            <div className="relative -mt-8 pb-8">
                <div className="max-w-[1000px] mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <main className="flex-1 min-w-0">
                            {/* Community Info Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-4">
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                                        {/* Community Icon */}
                                        <div className="relative w-24 h-24 mx-auto sm:mx-0 -mt-16 sm:-mt-16 z-10">
                                            {subfapp?.imageUrl ? (
                                                <Image
                                                    src={subfapp.imageUrl}
                                                    alt={subfapp.name}
                                                    fill
                                                    className="rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl text-white font-bold border-4 border-white dark:border-gray-800 shadow-md">
                                                    {subfapp?.name[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Community Info */}
                                        <div className="flex-1 min-w-0 text-center sm:text-left mt-4 sm:mt-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="space-y-2">
                                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                                        f/{subfapp?.name}
                                                    </h1>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {subfapp?.memberCount.toLocaleString()} {subfapp?.memberCount === 1 ? 'member' : 'members'}
                                                    </p>
                                                    <p className="text-gray-600 dark:text-gray-300 text-sm max-w-2xl">
                                                        {subfapp?.description}
                                                    </p>
                                                </div>
                                                {user && (
                                                    <div className="sm:self-start">
                                                        <button
                                                            onClick={handleJoinToggle}
                                                            disabled={joinLoading}
                                                            className={`px-8 py-2 rounded-full font-medium text-sm transition-colors w-full sm:w-auto ${
                                                                isJoined
                                                                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                                                    : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                                                            } disabled:opacity-50`}
                                                        >
                                                            {joinLoading ? 'Loading...' : isJoined ? 'Joined' : 'Join'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Posts */}
                            <PostList />
                        </main>

                        {/* Sidebar */}
                        <aside className="hidden lg:block w-80 flex-none">
                            <div className="sticky top-32 pt-4">
                                <Sidebar />
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
} 