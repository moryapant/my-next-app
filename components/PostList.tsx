'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

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
    
    // Handle both Firestore Timestamp and raw timestamp data
    const date = timestamp instanceof Timestamp 
        ? timestamp.toDate()
        : new Date(timestamp.seconds * 1000);
    
    return date.toLocaleDateString();
};

export default function PostList() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsQuery = query(
                    collection(db, 'posts'),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
                
                const querySnapshot = await getDocs(postsQuery);
                const fetchedPosts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Post[];
                
                setPosts(fetchedPosts);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            {posts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    {/* Post Header */}
                    <div className="p-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <Link href={`/subfapps/${post.subfappName.toLowerCase()}`} className="hover:underline">
                                f/{post.subfappName}
                            </Link>
                            <span>•</span>
                            <span>Posted by {post.authorName}</span>
                            <span>•</span>
                            <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <h2 className="text-xl font-semibold mt-2 text-gray-900 dark:text-white">{post.title}</h2>
                    </div>

                    {/* Post Content */}
                    <div className="px-4 pb-4">
                        <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                    </div>

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                        <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 p-4`}>
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
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span>{post.votes}</span>
                            <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                        <button className="flex items-center space-x-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.commentCount} Comments</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
} 