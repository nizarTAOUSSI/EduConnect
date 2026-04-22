import { useAuth } from './useAuth';

export function useAuthPersist() {
  const { user, isLoading } = useAuth();

  return { user, isLoading };
}
