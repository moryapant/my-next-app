'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

interface CreateSubFappFormProps {
  onSuccess?: () => void;
}

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove special characters
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/-+/g, '-');        // Replace multiple - with single -
};

export default function CreateSubFappForm({ onSuccess }: CreateSubFappFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const slug = createSlug(formData.name);
      
      // Upload image if one is selected
      let imageUrl = '';
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please upload an image file');
          setIsLoading(false);
          return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size should be less than 5MB');
          setIsLoading(false);
          return;
        }

        try {
          // Create a clean filename
          const timestamp = Date.now();
          const cleanFileName = `${slug}-${timestamp}`.replace(/[^a-z0-9-]/g, '-');
          const fileExtension = file.name.split('.').pop();
          const fileName = `${cleanFileName}.${fileExtension}`;
          
          // Convert file to base64
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });
          reader.readAsDataURL(file);
          const base64Data = await base64Promise;
          
          // Save image URL (relative to public directory)
          imageUrl = `/images/subfapps/${fileName}`;
          
          // Create a POST request to save the image
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              fileName: fileName,
              directory: 'subfapps'
            }),
          });

          try {
            const responseData = await response.json();
            if (!response.ok || !responseData.success) {
              throw new Error(responseData.message || 'Failed to upload image');
            }
            // Update imageUrl with the path from the response
            imageUrl = responseData.path;
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Invalid server response');
          }
        } catch (uploadError) {
          console.error('Error saving image:', uploadError);
          setError(uploadError instanceof Error ? uploadError.message : 'Failed to save image. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      const docRef = await addDoc(collection(db, 'subfapps'), {
        name: formData.name,
        description: formData.description,
        slug,
        imageUrl,
        createdAt: serverTimestamp(),
        creatorId: user.uid,
        memberCount: 1,
        isPublic: formData.isPublic,
      });

      // Add creator as first member
      await addDoc(collection(db, 'subfapps', docRef.id, 'members'), {
        userId: user.uid,
        role: 'admin',
        joinedAt: serverTimestamp(),
      });

      if (onSuccess) {
        onSuccess();
      }
      router.push(`/subfapps/${slug}`);
    } catch (err) {
      setError('Failed to create subfapp. Please try again.');
      console.error('Error creating subfapp:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <div>
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative h-48 w-full">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400"
            >
              <span className="text-gray-500">Click to upload image</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
        />
        <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
          Make this subfapp public
        </label>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Subfapp'}
      </button>
    </form>
  );
} 