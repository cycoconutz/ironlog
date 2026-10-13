import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import { clearToken, getToken, onUnauthorized, setToken } from '../api/client';
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserResponse,
  WeightUnit,
} from '../api/types';

interface AuthContextValue {
  user: UserResponse | null;
  token: string | null;
  loading: boolean;
  login: (input: LoginRequest) => Promise<UserResponse>;
  register: (input: RegisterRequest) => Promise<UserResponse>;
  logout: () => void;
  updateProfile: (input: UpdateProfileRequest) => Promise<UserResponse>;
  setUnit: (unit: WeightUnit) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState<boolean>(() => Boolean(getToken()));

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => onUnauthorized(logout), [logout]);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authApi
      .me()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (input: LoginRequest) => {
    const response = await authApi.login(input);
    setToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (input: RegisterRequest) => {
    const response = await authApi.register(input);
    setToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileRequest) => {
    const profile = await authApi.updateProfile(input);
    setUser(profile);
    return profile;
  }, []);

  const setUnit = useCallback(
    async (unit: WeightUnit) => {
      if (!user || user.unit === unit) return;
      const previous = user;
      setUser({ ...user, unit });
      try {
        const updated = await authApi.updateProfile({ displayName: user.displayName, unit });
        setUser(updated);
      } catch {
        setUser(previous);
      }
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, updateProfile, setUnit }),
    [user, token, loading, login, register, logout, updateProfile, setUnit],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
