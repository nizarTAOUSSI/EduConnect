import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../context/AuthContext';

export default function RequireRole({
  role,
  children,
}: {
  role: User['role'];
  children: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!user) return null;
  if (user.role !== role) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

