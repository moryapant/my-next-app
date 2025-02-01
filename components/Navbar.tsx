'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import LoginButton from './LoginButton';
import SubfappSelect from './SubfappSelect';
import CreatePostForm from './CreatePostForm';
import CreateSubFappForm from './CreateSubFappForm';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateSubfapp, setShowCreateSubfapp] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedSubfapp, setSelectedSubfapp] = useState<{ id: string; name: string } | null>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                Fapp
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="relative" ref={createMenuRef}>
                    <button
                      onClick={() => setShowCreateMenu(!showCreateMenu)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Create Menu Dropdown */}
                    {showCreateMenu && (
                      <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden">
                        {/* Create Post Option */}
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Create a Post</h3>
                          </div>
                          <SubfappSelect
                            onSelect={(subfapp) => {
                              setSelectedSubfapp(subfapp);
                              setShowCreatePost(true);
                              setShowCreateMenu(false);
                            }}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="border-t dark:border-gray-700"></div>
                        
                        {/* Create Subfapp Option */}
                        <button
                          onClick={() => {
                            setShowCreateSubfapp(true);
                            setShowCreateMenu(false);
                          }}
                          className="w-full text-left p-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Create New Subfapp</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 focus:outline-none"
                    >
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white ring-2 ring-gray-200 dark:ring-gray-700">
                          {user.displayName?.[0] || user.email?.[0] || 'U'}
                        </div>
                      )}
                      <svg
                        className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 py-1">
                        <div className="px-4 py-2 border-b dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.displayName || user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <LoginButton />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Create Post Modal */}
      {showCreatePost && selectedSubfapp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Post in subfapps/{selectedSubfapp.name}
              </h2>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <CreatePostForm
                subfappId={selectedSubfapp.id}
                subfappName={selectedSubfapp.name}
                onSuccess={() => {
                  setShowCreatePost(false);
                  // Force a refresh of the posts list
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Subfapp Modal */}
      {showCreateSubfapp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Subfapp
              </h2>
              <button
                onClick={() => setShowCreateSubfapp(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <CreateSubFappForm onSuccess={() => setShowCreateSubfapp(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 