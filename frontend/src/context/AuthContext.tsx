import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<AuthResponse>;
  loginWithGoogle: (email: string, fullName?: string) => Promise<AuthResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('teamcrm_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed) {
        if (!parsed.roleName && parsed.role) {
          parsed.roleName = parsed.role;
        }
        if (parsed.email && parsed.email.toLowerCase() === 'payaldjadhao@gmail.com') {
          parsed.roleName = 'ROLE_ADMIN';
          parsed.role = 'ROLE_ADMIN';
          parsed.teamTag = 'MANAGEMENT';
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('teamcrm_token');
  });

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profile = await authApi.getMe();
      if (profile && profile.email.toLowerCase() === 'payaldjadhao@gmail.com') {
        profile.roleName = 'ROLE_ADMIN';
        (profile as any).role = 'ROLE_ADMIN';
        profile.teamTag = 'MANAGEMENT';
      }
      setUser(profile);
      sessionStorage.setItem('teamcrm_user', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token]);

  const login = async (email: string, pass: string): Promise<AuthResponse> => {
    const res = await authApi.login(email, pass);
    setToken(res.accessToken);
    sessionStorage.setItem('teamcrm_token', res.accessToken);
    sessionStorage.setItem('teamcrm_refresh_token', res.refreshToken);

    const isAdmin = res.email.toLowerCase() === 'payaldjadhao@gmail.com' || res.role === 'ROLE_ADMIN';
    const effectiveRole = isAdmin ? 'ROLE_ADMIN' : res.role;

    const initialUser: User = {
      id: res.userId,
      email: res.email,
      fullName: res.fullName,
      roleName: effectiveRole,
      teamTag: isAdmin ? 'MANAGEMENT' : res.teamTag,
      isActive: true,
      isFirstLogin: res.isFirstLogin,
      permissions: isAdmin ? ['ROLE_ADMIN', 'USER_CREATE', 'USER_EDIT', 'USER_DEACTIVATE', 'ROLE_MANAGE', 'REPORT_VIEW', 'AUDIT_VIEW'] : Array.from(res.permissions || []),
    };
    (initialUser as any).role = effectiveRole;
    setUser(initialUser);
    sessionStorage.setItem('teamcrm_user', JSON.stringify(initialUser));

    return res;
  };

  const loginWithGoogle = async (email: string, fullName?: string): Promise<AuthResponse> => {
    const res = await authApi.loginWithGoogle(email, fullName);
    setToken(res.accessToken);
    sessionStorage.setItem('teamcrm_token', res.accessToken);
    sessionStorage.setItem('teamcrm_refresh_token', res.refreshToken);

    const isAdmin = res.email.toLowerCase() === 'payaldjadhao@gmail.com' || res.role === 'ROLE_ADMIN';
    const effectiveRole = isAdmin ? 'ROLE_ADMIN' : res.role;

    const initialUser: User = {
      id: res.userId,
      email: res.email,
      fullName: res.fullName,
      roleName: effectiveRole,
      teamTag: isAdmin ? 'MANAGEMENT' : res.teamTag,
      isActive: true,
      isFirstLogin: res.isFirstLogin,
      permissions: isAdmin ? ['ROLE_ADMIN', 'USER_CREATE', 'USER_EDIT', 'USER_DEACTIVATE', 'ROLE_MANAGE', 'REPORT_VIEW', 'AUDIT_VIEW'] : Array.from(res.permissions || []),
    };
    (initialUser as any).role = effectiveRole;
    setUser(initialUser);
    sessionStorage.setItem('teamcrm_user', JSON.stringify(initialUser));

    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('teamcrm_token');
    sessionStorage.removeItem('teamcrm_refresh_token');
    sessionStorage.removeItem('teamcrm_user');
    localStorage.removeItem('teamcrm_token');
    localStorage.removeItem('teamcrm_refresh_token');
    localStorage.removeItem('teamcrm_user');
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    const currentRole = user.roleName || (user as any).role;
    if (currentRole === 'ROLE_ADMIN') return true;
    return user.permissions?.includes(permissionCode) || false;
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    const currentRole = user.roleName || (user as any).role;
    if (currentRole === 'ROLE_ADMIN') return true;
    return currentRole === roleName;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, logout, refreshProfile, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * <Can permission="TASK_ASSIGN">
 *   <button>Assign Task</button>
 * </Can>
 */
export const Can: React.FC<{
  permission?: string;
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, role, children, fallback = null }) => {
  const { hasPermission, hasRole } = useAuth();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
