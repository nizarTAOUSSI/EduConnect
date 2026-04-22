import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useAuthPersist() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    // Token persistence is handled in AuthContext
    // This hook can be extended for additional persistence logic
  }, []);

  return { user, isLoading };
}
