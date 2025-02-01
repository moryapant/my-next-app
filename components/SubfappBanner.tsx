import { useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SubfappBannerProps {
    subfappId: string;
    creatorId: string;
    bannerUrl?: string;
    onBannerUpdate: (newUrl: string) => void;
}

export default function SubfappBanner({ subfappId, creatorId, bannerUrl, onBannerUpdate }: SubfappBannerProps) {
    const { user } = useAuth();
    const [isHovering, setIsHovering] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Only set isCreator to true if both user and creatorId exist and match
    const isCreator = Boolean(user?.uid && creatorId && user.uid === creatorId);

    // Debug information
    console.log('Banner Debug:', {
        currentUserId: user?.uid || 'not logged in',
        creatorId: creatorId || 'not set',
        isCreator,
        isHovering,
        shouldShowButton: isCreator && (isHovering || uploading)
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            // First upload the file
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload-banner', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const { imageUrl } = await response.json();

            // Then update Firestore with the new URL
            try {
                const subfappRef = doc(db, 'subfapps', subfappId);
                await updateDoc(subfappRef, {
                    bannerUrl: imageUrl,
                });
                onBannerUpdate(imageUrl);
            } catch (error) {
                console.error('Error updating Firestore:', error);
                alert('Image uploaded but failed to update banner. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading banner:', error);
            alert('Failed to upload banner image. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div 
            className="relative h-48 md:h-64 w-full group cursor-pointer"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {bannerUrl ? (
                <Image
                    src={bannerUrl}
                    alt="Subfapp banner"
                    fill
                    className="object-cover"
                    priority
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
            )}
            <div className="absolute inset-0 bg-black/30" />
            
            {/* Always show debug info for creator */}
            {isCreator && (
                <div className="absolute top-2 left-2 text-white text-sm bg-black/50 p-2 rounded z-20">
                    Creator Controls Available
                </div>
            )}
            
            {isCreator && (
                <div 
                    className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-all duration-200 z-10 ${
                        isHovering || uploading ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                >
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-medium shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 z-30"
                    >
                        {uploading ? 'Uploading...' : 'Change Banner Image'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
} 