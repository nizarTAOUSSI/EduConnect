import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'enseignant' | 'etudiant' | 'parent';
  is_active: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export interface SignupData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'enseignant' | 'etudiant' | 'parent';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

const API_BASE_URL = 'https://backend-production-904d.up.railway.app/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const userResponse = await fetch(`${API_BASE_URL}/accounts/auth/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!userResponse.ok) return;
        const userData = await userResponse.json();
        if (!cancelled) setUser(userData);
      } catch {
        // ignore bootstrap errors (offline/CORS/etc.)
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/auth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      const { access } = await response.json();
      localStorage.setItem('access_token', access);

      // Fetch user data
      const userResponse = await fetch(`${API_BASE_URL}/accounts/auth/me/`, {
        headers: {
          'Authorization': `Bearer ${access}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/utilisateurs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          username: data.email,
        }),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.detail || JSON.stringify(responseData));
      }

      await login(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
