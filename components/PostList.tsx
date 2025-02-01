'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Post {
    id: string;
    title: string;
    content: string;
    images: string[];
    authorName: string;
    subfappName: string;
    createdAt: Timestamp;
    votes: number;
    commentCount: number;
}

const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Date(date).toLocaleDateString();
};

export default function PostList() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { subfappName } = router.query;

    const fetchPosts = async () => {
        try {
            let q;
            if (subfappName) {
                // If we're in a subfapp page, only fetch posts for that subfapp
                // First get the posts for this subfapp without ordering
                q = query(
                    collection(db, 'posts'),
                    where('subfappName', '==', subfappName)
                );
            } else {
                // Otherwise fetch all posts
                q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
            }
            
            const querySnapshot = await getDocs(q);
            const fetchedPosts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];

            // Sort the posts client-side if we're in a subfapp page
            if (subfappName) {
                fetchedPosts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            }

            setPosts(fetchedPosts);
            setError('');
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [subfappName]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 py-8">
                {error}
                <button
                    onClick={fetchPosts}
                    className="ml-2 text-blue-500 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {posts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        No posts yet. Be the first to post!
                    </p>
                </div>
            ) : (
                posts.map((post) => (
                    <div key={post.id} className="group bg-white dark:bg-gray-800 rounded-md hover:border hover:border-gray-300 dark:hover:border-gray-600">
                        <div className="flex">
                            {/* Vote buttons - left side */}
                            <div className="w-10 bg-gray-50 dark:bg-gray-800 pt-2 rounded-l-md">
                                <div className="flex flex-col items-center">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle upvote
                                        }}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-sm"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{post.votes}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle downvote
                                        }}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 rounded-sm"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Post content - right side */}
                            <Link 
                                href={`/subfapps/${post.subfappName.toLowerCase()}/posts/${post.id}`}
                                className="flex-1 p-2 cursor-pointer"
                            >
                                {/* Post Header */}
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <span 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/subfapps/${post.subfappName.toLowerCase()}`);
                                        }}
                                        className="font-bold hover:underline text-gray-900 dark:text-white cursor-pointer"
                                    >
                                        f/{post.subfappName}
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span>Posted by </span>
                                    <span className="hover:underline ml-1 cursor-pointer">{post.authorName}</span>
                                    <span className="mx-1">•</span>
                                    <span>{formatDate(post.createdAt)}</span>
                                </div>

                                {/* Title */}
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    {post.title}
                                </h2>

                                {/* Content */}
                                <div className="text-sm text-gray-800 dark:text-gray-200 mb-2">
                                    <p>{post.content}</p>
                                </div>

                                {/* Images */}
                                {post.images && post.images.length > 0 && (
                                    <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mb-2`}>
                                        {post.images.map((imageUrl, index) => (
                                            <div key={index} className="relative aspect-video rounded-md overflow-hidden">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Post image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/subfapps/${post.subfappName.toLowerCase()}/posts/${post.id}`);
                                        }}
                                        className="flex items-center space-x-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <span>{post.commentCount} Comments</span>
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle share
                                        }}
                                        className="flex items-center space-x-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span>Share</span>
                                    </button>
                                </div>
                            </Link>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
} 