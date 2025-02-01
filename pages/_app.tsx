import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import type { AppProps } from 'next/app';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Component {...pageProps} />
        </main>
      </div>
    </AuthProvider>
  );
}

export default MyApp; 