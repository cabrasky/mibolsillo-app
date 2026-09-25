/* ── AuthContext: manages login state across the app ───────────────────────── */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getMe, getGoogleAuthUrl, setToken, getToken, setStoredUser, getStoredUser, updatePreferences as apiUpdatePreferences, type AccountPreferences } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  is_admin: boolean;
  is_developer: boolean;
  locale?: AccountPreferences['locale'];
  theme?: AccountPreferences['theme'];
  weekly_goal?: number | null;
  setup_done?: boolean;
  mobile_tour_done?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => void;
  refreshUser: () => Promise<void>;
  updatePreferences: (body: Partial<AccountPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const user = await getMe();
      setUser(user);
      setStoredUser(user);
    } catch {
      setToken(null);
      setStoredUser(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check URL for token (from Google OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setToken(data.token);
    setUser(data.user);
    setStoredUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await apiRegister(email, password, name);
    setToken(data.token);
    setUser(data.user);
    setStoredUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
  };

  // Guarda preferencias en la cuenta y refresca el usuario con lo que devuelve el servidor
  const updatePreferences = useCallback(async (body: Partial<AccountPreferences>) => {
    const updated = await apiUpdatePreferences(body);
    setUser(updated);
    setStoredUser(updated);
  }, []);

  const googleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin, refreshUser, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
