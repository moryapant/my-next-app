'use client';

import PostList from '@/components/PostList';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pt-12">
        <div className="max-w-[1000px] mx-auto flex gap-6 px-4">
          <main className="flex-1 min-w-0">
            <PostList />
          </main>
          <aside className="hidden lg:block w-[312px] flex-none">
            <div className="sticky top-[3.5rem]">
              <Sidebar />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
} 