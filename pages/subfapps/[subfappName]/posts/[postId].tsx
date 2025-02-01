import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import Sidebar from '@/components/Sidebar';

interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    subfappName: string;
    createdAt: { seconds: number; nanoseconds: number };
    votes: number;
    commentCount: number;
    images?: string[];
}

export default function PostPage() {
    const router = useRouter();
    const { postId } = router.query;
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;

            try {
                const postRef = doc(db, 'posts', postId as string);
                const postSnap = await getDoc(postRef);

                if (!postSnap.exists()) {
                    setError('Post not found');
                    setLoading(false);
                    return;
                }

                setPost({
                    id: postSnap.id,
                    ...postSnap.data()
                } as Post);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

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

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12">
                <div className="max-w-[1000px] mx-auto flex gap-6 px-4">
                    <div className="flex-1 min-w-0">
                        <div className="text-center text-red-500 py-8">
                            {error || 'Post not found'}
                            <Link href="/" className="ml-2 text-blue-500 hover:underline">
                                Return home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center">
                        <button 
                            className="absolute top-4 right-4 text-white hover:text-gray-300"
                            onClick={() => setSelectedImage(null)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={selectedImage}
                            alt="Full size"
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-12">
                <div className="max-w-[1000px] mx-auto flex gap-6 px-4">
                    <main className="flex-1 min-w-0">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <div className="flex">
                                {/* Vote buttons - left side */}
                                <div className="w-10 bg-gray-50 dark:bg-gray-800 pt-2 rounded-l-md">
                                    <div className="flex flex-col items-center">
                                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-sm">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{post.votes}</span>
                                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 rounded-sm">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Post content - right side */}
                                <div className="flex-1 p-4">
                                    {/* Post Header */}
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        <Link
                                            href={`/subfapps/${post.subfappName.toLowerCase()}`}
                                            className="font-bold hover:underline text-gray-900 dark:text-white"
                                        >
                                            f/{post.subfappName}
                                        </Link>
                                        <span className="mx-1">•</span>
                                        <span>Posted by </span>
                                        <span className="hover:underline ml-1">{post.authorName}</span>
                                        <span className="mx-1">•</span>
                                        <span>{formatDate(post.createdAt)}</span>
                                    </div>

                                    {/* Title */}
                                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                        {post.title}
                                    </h1>

                                    {/* Content */}
                                    <div className="text-base text-gray-800 dark:text-gray-200 mb-4">
                                        <p>{post.content}</p>
                                    </div>

                                    {/* Images */}
                                    {post.images && post.images.length > 0 && (
                                        <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-4`}>
                                            {post.images.map((imageUrl, index) => (
                                                <div 
                                                    key={index} 
                                                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer"
                                                    onClick={() => setSelectedImage(imageUrl)}
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Post image ${index + 1}`}
                                                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-4 mt-4">
                                        <div className="flex items-center space-x-1">
                                            <span className="text-xs">{post.votes} votes</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-xs">{post.commentCount} comments</span>
                                        </div>
                                        <button className="flex items-center space-x-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                            <span>Share</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    <aside className="hidden lg:block w-[312px] flex-none">
                        <div className="sticky top-[3.5rem]">
                            <Sidebar />
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}