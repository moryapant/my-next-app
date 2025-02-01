'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

interface Subfapp {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    memberCount: number;
    slug: string;
}

const Sidebar = () => {
    const { user } = useAuth();
    const [subfapps, setSubfapps] = useState<Subfapp[]>([]);
    const [joinedSubfapps, setJoinedSubfapps] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [joinLoading, setJoinLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubfapps = async () => {
            try {
                const q = query(collection(db, 'subfapps'), orderBy('memberCount', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedSubfapps = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Subfapp[];
                setSubfapps(fetchedSubfapps);

                // Fetch user's joined subfapps if logged in
                if (user) {
                    const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
                    if (!userSnap.empty) {
                        const userData = userSnap.docs[0].data();
                        setJoinedSubfapps(new Set(userData.joinedSubfapps || []));
                    }
                }
            } catch (err) {
                console.error('Error fetching subfapps:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubfapps();
    }, [user]);

    const handleJoinToggle = async (subfappId: string) => {
        if (!user) return;
        
        setJoinLoading(subfappId);
        try {
            const userRef = doc(db, 'users', user.uid);
            const subfappRef = doc(db, 'subfapps', subfappId);
            const isJoined = joinedSubfapps.has(subfappId);

            // Update user's joined subfapps
            await updateDoc(userRef, {
                joinedSubfapps: isJoined ? arrayRemove(subfappId) : arrayUnion(subfappId)
            });

            // Update subfapp's member count
            const subfapp = subfapps.find(s => s.id === subfappId);
            if (subfapp) {
                await updateDoc(subfappRef, {
                    memberCount: isJoined ? subfapp.memberCount - 1 : subfapp.memberCount + 1
                });

                // Update local state
                setSubfapps(prev => prev.map(s => 
                    s.id === subfappId 
                        ? { ...s, memberCount: isJoined ? s.memberCount - 1 : s.memberCount + 1 }
                        : s
                ));
            }

            // Update joined state
            setJoinedSubfapps(prev => {
                const next = new Set(prev);
                if (isJoined) {
                    next.delete(subfappId);
                } else {
                    next.add(subfappId);
                }
                return next;
            });
        } catch (err) {
            console.error('Error toggling join status:', err);
        } finally {
            setJoinLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="py-4">
            <div className="px-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Communities</h2>
                {user && joinedSubfapps.size > 0 ? (
                    <div className="space-y-3">
                        {subfapps
                            .filter(subfapp => joinedSubfapps.has(subfapp.id))
                            .map(subfapp => (
                                <Link
                                    key={subfapp.id}
                                    href={`/subfapps/${subfapp.slug}`}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                >
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        {subfapp.imageUrl ? (
                                            <Image
                                                src={subfapp.imageUrl}
                                                alt={subfapp.name}
                                                fill
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                                {subfapp.name[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {subfapp.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {subfapp.memberCount} {subfapp.memberCount === 1 ? 'member' : 'members'}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user ? "You haven't joined any communities yet." : "Sign in to join communities."}
                    </p>
                )}
            </div>

            <div className="px-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Communities</h2>
                <div className="space-y-3">
                    {subfapps
                        .filter(subfapp => !joinedSubfapps.has(subfapp.id))
                        .sort((a, b) => b.memberCount - a.memberCount)
                        .slice(0, 5)
                        .map(subfapp => (
                            <div
                                key={subfapp.id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="relative w-10 h-10 flex-shrink-0">
                                    {subfapp.imageUrl ? (
                                        <Image
                                            src={subfapp.imageUrl}
                                            alt={subfapp.name}
                                            fill
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                            {subfapp.name[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/subfapps/${subfapp.slug}`}>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-blue-500 dark:hover:text-blue-400">
                                            {subfapp.name}
                                        </p>
                                    </Link>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {subfapp.memberCount} {subfapp.memberCount === 1 ? 'member' : 'members'}
                                    </p>
                                </div>
                                {user && (
                                    <button
                                        onClick={() => handleJoinToggle(subfapp.id)}
                                        disabled={joinLoading === subfapp.id}
                                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                                            joinedSubfapps.has(subfapp.id)
                                                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                                : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                                        } disabled:opacity-50 whitespace-nowrap`}
                                    >
                                        {joinLoading === subfapp.id ? 'Loading...' : joinedSubfapps.has(subfapp.id) ? 'Joined' : 'Join'}
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 