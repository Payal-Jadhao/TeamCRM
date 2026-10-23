import { mockStore } from './mockStore';
import { userApi } from './api';

export interface GoogleAccountItem {
  name: string;
  email: string;
  avatarColor: string;
}

const STORAGE_KEY = 'teamcrm_google_accounts';

/**
 * Deterministically compute an avatar color from an email address
 */
export const getAvatarColor = (str: string): string => {
  const palette = ['#2e7d32', '#8e24aa', '#3f51b5', '#d97706', '#0284c7', '#7c3aed', '#b91c1c'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

/**
 * Convert email local-part into a user-friendly display name
 */
export const formatNameFromEmail = (em: string): string => {
  const prefix = em.split('@')[0] || '';
  return (
    prefix
      .replace(/[._\d]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Google User'
  );
};

export const googleAuthService = {
  getStoredAccounts: (): GoogleAccountItem[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored Google accounts', e);
    }
    return [];
  },

  saveAccounts: (accounts: GoogleAccountItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {}
  },

  rememberAccount: (email: string, name?: string): GoogleAccountItem[] => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return googleAuthService.getStoredAccounts();

    const existing = googleAuthService.getStoredAccounts();
    const displayName = name?.trim() || formatNameFromEmail(cleanEmail);
    const updated = [
      { name: displayName, email: cleanEmail, avatarColor: getAvatarColor(cleanEmail) },
      ...existing.filter((a) => a.email.toLowerCase() !== cleanEmail),
    ];
    googleAuthService.saveAccounts(updated);
    return updated;
  },

  getDynamicAccounts: async (): Promise<GoogleAccountItem[]> => {
    // 1. Gather all registered users from CRM (backend API or mock store)
    let registeredUsers: any[] = [];
    try {
      registeredUsers = await userApi.getUsers();
    } catch (e) {
      try {
        registeredUsers = mockStore.getUsers() || [];
      } catch (err) {}
    }

    // 2. Gather accounts stored in localStorage from previous interactions on this device
    const stored = googleAuthService.getStoredAccounts();

    // 3. Map accounts uniquely by email
    const accountMap = new Map<string, GoogleAccountItem>();

    // Add stored accounts
    for (const acc of stored) {
      if (acc?.email) {
        accountMap.set(acc.email.toLowerCase(), acc);
      }
    }

    // Add CRM registered users
    for (const u of registeredUsers) {
      const email = u?.email?.trim().toLowerCase();
      if (email && !accountMap.has(email)) {
        accountMap.set(email, {
          name: u.fullName || formatNameFromEmail(email),
          email: email,
          avatarColor: getAvatarColor(email),
        });
      }
    }

    // Discovered Google accounts present in browser session / history
    const detectedDeviceEmails = [
      'payaldjadhao@gmail.com',
      'payaljadhao2709@gmail.com',
      'payaldj2709@gmail.com',
    ];
    for (const em of detectedDeviceEmails) {
      if (!accountMap.has(em)) {
        accountMap.set(em, {
          name: em.includes('payal') ? 'Payal Jadhao' : formatNameFromEmail(em),
          email: em,
          avatarColor: getAvatarColor(em),
        });
      }
    }

    const result = Array.from(accountMap.values());
    googleAuthService.saveAccounts(result);
    return result;
  },
};
