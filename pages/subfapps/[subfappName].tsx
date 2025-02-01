import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PostList from '@/components/PostList';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

interface SubFapp {
    id: string;
    name: string;
    description: string;
    slug: string;
    imageUrl?: string;
    memberCount: number;
    createdAt: { seconds: number; nanoseconds: number };
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
                setSubfapp({
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    slug: data.slug,
                    imageUrl: data.imageUrl,
                    memberCount: data.memberCount || 0,
                    createdAt: data.createdAt,
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12">
            <div className="max-w-[1000px] mx-auto flex gap-6 px-4">
                <main className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {subfapp.imageUrl && (
                                    <img
                                        src={subfapp.imageUrl}
                                        alt={subfapp.name}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        f/{subfapp.name}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {subfapp.description}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {subfapp.memberCount} {subfapp.memberCount === 1 ? 'member' : 'members'}
                                    </p>
                                </div>
                            </div>
                            {user && (
                                <button
                                    onClick={handleJoinToggle}
                                    disabled={joinLoading}
                                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                                        isJoined
                                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                            : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                                    } disabled:opacity-50`}
                                >
                                    {joinLoading ? 'Loading...' : isJoined ? 'Joined' : 'Join'}
                                </button>
                            )}
                        </div>
                    </div>
                    <PostList />
                </main>

                <aside className="hidden lg:block w-[312px] flex-none">
                    <div className="sticky top-[3.5rem]">
                        <Sidebar />
                    </div>
                </aside>
            </div>
        </div>
    );
} 