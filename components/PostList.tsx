'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

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
    const [isJoined, setIsJoined] = useState(false);
    const router = useRouter();
    const { subfappName } = router.query;
    const { user } = useAuth();

    useEffect(() => {
        const checkMembership = async () => {
            if (!subfappName || typeof subfappName !== 'string') {
                setIsJoined(true);
                return;
            }

            if (!user) {
                setIsJoined(false);
                return;
            }

            try {
                const userSnap = await getDocs(query(
                    collection(db, 'users'),
                    where('__name__', '==', user.uid)
                ));

                if (!userSnap.empty) {
                    const userData = userSnap.docs[0].data();
                    const subfappsRef = collection(db, 'subfapps');
                    const subfappQuery = query(subfappsRef, where('slug', '==', subfappName.toLowerCase()));
                    const subfappSnap = await getDocs(subfappQuery);

                    if (!subfappSnap.empty) {
                        const subfappId = subfappSnap.docs[0].id;
                        setIsJoined(userData.joinedSubfapps?.includes(subfappId) || false);
                    }
                }
            } catch (err) {
                console.error('Error checking membership:', err);
                setIsJoined(false);
            }
        };

        checkMembership();
    }, [user, subfappName]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                let postsQuery;

                if (subfappName && typeof subfappName === 'string') {
                    const subfappsRef = collection(db, 'subfapps');
                    const subfappQuery = query(subfappsRef, where('slug', '==', subfappName.toLowerCase()));
                    const subfappSnap = await getDocs(subfappQuery);

                    if (subfappSnap.empty) {
                        setError('Subfapp not found');
                        setLoading(false);
                        return;
                    }

                    const subfappId = subfappSnap.docs[0].id;
                    postsQuery = query(
                        collection(db, 'posts'),
                        where('subfappId', '==', subfappId),
                        orderBy('createdAt', 'desc')
                    );
                } else {
                    postsQuery = query(
                        collection(db, 'posts'),
                        orderBy('createdAt', 'desc')
                    );
                }

                const querySnapshot = await getDocs(postsQuery);
                const fetchedPosts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Post[];

                setPosts(fetchedPosts);
            } catch (err) {
                console.error('Error fetching posts:', err);
                setError('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [subfappName]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (subfappName && !isJoined) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Join this community to see its posts
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    You need to be a member to view and interact with posts in this community.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center py-4">
                {error}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                    {subfappName ? "No posts yet. Be the first to post!" : "No posts available."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {posts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:border hover:border-gray-300 dark:hover:border-gray-600">
                    <div className="flex">
                        {/* Vote buttons - left side */}
                        <div className="w-10 bg-gray-50 dark:bg-gray-800 pt-2 rounded-l-lg flex-shrink-0">
                            <div className="flex flex-col items-center">
                                <button 
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 rounded"
                                    aria-label="Upvote"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                </button>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{post.votes || 0}</span>
                                <button 
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 rounded"
                                    aria-label="Downvote"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Post content - right side */}
                        <div className="flex-1 p-3">
                            {/* Post Header */}
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Link 
                                    href={`/subfapps/${post.subfappName.toLowerCase()}`}
                                    className="font-bold hover:underline text-gray-900 dark:text-white"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    f/{post.subfappName}
                                </Link>
                                <span className="mx-1">•</span>
                                <span>Posted by {post.authorName}</span>
                                <span className="mx-1">•</span>
                                <span>{formatDate(post.createdAt)}</span>
                            </div>

                            {/* Title and Content */}
                            <Link href={`/subfapps/${post.subfappName.toLowerCase()}/posts/${post.id}`}>
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white mt-2 mb-2">
                                    {post.title}
                                </h2>
                                <div className="text-sm text-gray-800 dark:text-gray-200">
                                    <p className="line-clamp-3">{post.content}</p>
                                </div>
                            </Link>

                            {/* Images */}
                            {post.images && post.images.length > 0 && (
                                <div className="mt-3">
                                    <div className={`grid gap-2 ${
                                        post.images.length === 1 ? 'grid-cols-1' : 
                                        post.images.length === 2 ? 'grid-cols-2' :
                                        'grid-cols-2'
                                    }`}>
                                        {post.images.slice(0, 4).map((image, index) => (
                                            <div 
                                                key={index} 
                                                className={`relative ${
                                                    post.images.length === 1 ? 'h-96' : 
                                                    post.images.length === 2 ? 'h-64' :
                                                    'h-48'
                                                } ${
                                                    post.images.length > 4 && index === 3 ? 'relative' : ''
                                                }`}
                                            >
                                                <img 
                                                    src={image} 
                                                    alt={`Post image ${index + 1}`} 
                                                    className="rounded-md w-full h-full object-cover"
                                                />
                                                {post.images.length > 4 && index === 3 && (
                                                    <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                                                        <span className="text-white text-lg font-medium">
                                                            +{post.images.length - 4} more
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center mt-3 text-xs text-gray-500 dark:text-gray-400 space-x-4">
                                <Link 
                                    href={`/subfapps/${post.subfappName.toLowerCase()}/posts/${post.id}`}
                                    className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{post.commentCount || 0} Comments</span>
                                </Link>
                                <button className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
} 