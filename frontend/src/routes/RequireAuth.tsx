import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RequireAuth({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; 
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

