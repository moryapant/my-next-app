'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';

interface Subfapp {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
}

interface SubfappSelectProps {
    onSelect: (subfapp: { id: string; name: string }) => void;
    className?: string;
}

export default function SubfappSelect({ onSelect, className = '' }: SubfappSelectProps) {
    const [subfapps, setSubfapps] = useState<Subfapp[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSubfapps = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'subfapps'));
                const fetchedSubfapps = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Subfapp[];
                setSubfapps(fetchedSubfapps);
            } catch (error) {
                console.error('Error fetching subfapps:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubfapps();
    }, []);

    const filteredSubfapps = subfapps.filter(subfapp =>
        subfapp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subfapp.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={`${className} bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700`}>
                <div className="p-2 space-y-2">
                    <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className} bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700`}>
            <div className="p-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search subfapps..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg
                        className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="mt-2 max-h-60 overflow-y-auto">
                    {filteredSubfapps.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No subfapps found
                        </div>
                    ) : (
                        filteredSubfapps.map((subfapp) => (
                            <button
                                key={subfapp.id}
                                onClick={() => onSelect({ id: subfapp.id, name: subfapp.name })}
                                className="w-full p-2 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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
                                <div className="flex-1 text-left">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        f/{subfapp.name}
                                    </div>
                                    {subfapp.description && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {subfapp.description}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 