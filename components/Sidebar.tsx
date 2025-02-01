'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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
            <div className="h-full bg-white dark:bg-gray-800">
                <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Communities</h2>
                    {user && (
                        <Link
                            href="/subfapps/create"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Create New
                        </Link>
                    )}
                </div>
                <div className="space-y-2">
                    {subfapps.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                            No communities yet
                        </div>
                    ) : (
                        subfapps.map((subfapp) => (
                            <div
                                key={subfapp.id}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <Link
                                        href={`/subfapps/${subfapp.slug.toLowerCase()}`}
                                        className="flex items-center space-x-3 flex-1"
                                    >
                                        {subfapp.imageUrl ? (
                                            <Image
                                                src={subfapp.imageUrl}
                                                alt={subfapp.name}
                                                width={32}
                                                height={32}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                                                {subfapp.name[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                f/{subfapp.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {subfapp.memberCount} members
                                            </p>
                                        </div>
                                    </Link>
                                    {user && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleJoinToggle(subfapp.id);
                                            }}
                                            className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                joinedSubfapps.has(subfapp.id)
                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
                                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                            }`}
                                        >
                                            {joinedSubfapps.has(subfapp.id) ? 'Joined' : 'Join'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 