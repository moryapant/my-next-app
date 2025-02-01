'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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

    useEffect(() => {
        const fetchSubfapps = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'subfapps'));
                const fetchedSubfapps = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Subfapp[];
                setSubfapps(fetchedSubfapps);

                // Fetch joined subfapps if user is logged in
                if (user) {
                    const membershipPromises = fetchedSubfapps.map(async (subfapp) => {
                        const membersQuery = query(
                            collection(db, 'subfapps', subfapp.id, 'members'),
                            where('userId', '==', user.uid)
                        );
                        const memberSnapshot = await getDocs(membersQuery);
                        return !memberSnapshot.empty;
                    });

                    const memberships = await Promise.all(membershipPromises);
                    const joinedIds = new Set(
                        fetchedSubfapps
                            .filter((_, index) => memberships[index])
                            .map(subfapp => subfapp.id)
                    );
                    setJoinedSubfapps(joinedIds);
                }
            } catch (error) {
                console.error('Error fetching subfapps:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubfapps();
    }, [user]);

    const handleJoinToggle = async (subfappId: string) => {
        if (!user) return;

        try {
            const subfapp = subfapps.find(s => s.id === subfappId);
            if (!subfapp) return;

            if (joinedSubfapps.has(subfappId)) {
                // Leave subfapp
                const membersQuery = query(
                    collection(db, 'subfapps', subfappId, 'members'),
                    where('userId', '==', user.uid)
                );
                const memberSnapshot = await getDocs(membersQuery);
                
                if (!memberSnapshot.empty) {
                    await deleteDoc(memberSnapshot.docs[0].ref);
                    setJoinedSubfapps(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(subfappId);
                        return newSet;
                    });
                    // Update memberCount in subfapps state
                    setSubfapps(prev => prev.map(s => 
                        s.id === subfappId 
                            ? { ...s, memberCount: s.memberCount - 1 }
                            : s
                    ));
                }
            } else {
                // Join subfapp
                await addDoc(collection(db, 'subfapps', subfappId, 'members'), {
                    userId: user.uid,
                    role: 'member',
                    joinedAt: serverTimestamp(),
                });
                
                setJoinedSubfapps(prev => new Set([...Array.from(prev), subfappId]));
                // Update memberCount in subfapps state
                setSubfapps(prev => prev.map(s => 
                    s.id === subfappId 
                        ? { ...s, memberCount: s.memberCount + 1 }
                        : s
                ));
            }
        } catch (error) {
            console.error('Error toggling join status:', error);
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
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                                        className="px-3 py-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                    >
                                        Join
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