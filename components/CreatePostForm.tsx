'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CreatePostFormProps {
    subfappId: string;
    subfappName: string;
    onSuccess?: () => void;
}

export default function CreatePostForm({ subfappId, subfappName, onSuccess }: CreatePostFormProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files);
            
            // Create local URLs for preview and storage
            newImages.forEach(image => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setImageUrls(prev => [...prev, base64String]);
                };
                reader.readAsDataURL(image);
            });
        }
    };

    const removeImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsLoading(true);
        setError('');

        try {
            // Create post document with base64 image strings
            await addDoc(collection(db, 'posts'), {
                title,
                content,
                images: imageUrls, // Store base64 strings directly
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                subfappId,
                subfappName,
                createdAt: serverTimestamp(),
                votes: 0,
                commentCount: 0
            });

            // Reset form
            setTitle('');
            setContent('');
            setImageUrls([]);
            
            // Call onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error creating post:', error);
            setError('Failed to create post. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create a Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Post Title"
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>
                
                <div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full px-4 py-2 border rounded-md h-32 resize-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>

                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        Add Images
                    </button>
                    <p className="text-sm text-gray-500 mt-1">Max file size: 1MB per image</p>
                </div>

                {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? 'Creating Post...' : 'Create Post'}
                </button>
            </form>
        </div>
    );
} 