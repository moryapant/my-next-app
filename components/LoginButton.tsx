'use client';

import { useAuth } from '@/context/AuthContext';

export default function LoginButton() {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      )}
    </div>
  );
} 