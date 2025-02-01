'use client';

import PostList from '@/components/PostList';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="flex">
        <aside className="w-64 fixed inset-y-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <Sidebar />
        </aside>
        <main className="flex-1 ml-64">
          <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <PostList />
          </div>
        </main>
      </div>
    </div>
  );
} 