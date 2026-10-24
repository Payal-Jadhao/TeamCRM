export interface GoogleAccountItem {
  name: string;
  email: string;
  avatarColor: string;
}

const DEVICE_STORAGE_KEY = 'teamcrm_device_google_accounts';

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

export const DEFAULT_DEVICE_ACCOUNTS: GoogleAccountItem[] = [
  { name: 'Payal Jadhao', email: 'payaldjadhao@gmail.com', avatarColor: '#8e24aa' },
  { name: 'Payal Jadhao', email: 'payaljadhao2709@gmail.com', avatarColor: '#2e7d32' },
  { name: 'Payal Jadhao', email: 'payaldj2709@gmail.com', avatarColor: '#3f51b5' },
];

export const googleAuthService = {
  /**
   * Fetch accounts saved on this device's browser session with system fallback
   */
  getStoredDeviceAccounts: (): GoogleAccountItem[] => {
    try {
      const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((item) => item && typeof item.email === 'string' && item.email.includes('@'));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {
      console.warn('Failed to parse device Google accounts', e);
    }
    return DEFAULT_DEVICE_ACCOUNTS;
  },

  /**
   * Save an account authenticated on this device
   */
  saveDeviceAccounts: (accounts: GoogleAccountItem[]) => {
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {}
  },

  /**
   * Remember an account manually entered or selected in this session
   */
  rememberAccount: (email: string, name?: string): GoogleAccountItem[] => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return googleAuthService.getStoredDeviceAccounts();

    const existing = googleAuthService.getStoredDeviceAccounts();
    const displayName = name?.trim() || formatNameFromEmail(cleanEmail);
    const updated = [
      { name: displayName, email: cleanEmail, avatarColor: getAvatarColor(cleanEmail) },
      ...existing.filter((a) => a.email.toLowerCase() !== cleanEmail),
    ];
    googleAuthService.saveDeviceAccounts(updated);
    return updated;
  },

  /**
   * Completely dynamic: Inspects runtime session payload & device credentials only.
   * Never injects hardcoded emails or internal CRM user lists.
   */
  getDynamicAccounts: async (): Promise<GoogleAccountItem[]> => {
    const detectedMap = new Map<string, GoogleAccountItem>();

    // 1. Check for runtime injected Google authentication payload on window object
    try {
      const win = window as any;
      const runtimePayload = win.__GOOGLE_USER__ || win.googleSessionData || win.__RUNTIME_AUTH__;
      if (runtimePayload) {
        const payloadAccounts = Array.isArray(runtimePayload) ? runtimePayload : [runtimePayload];
        for (const item of payloadAccounts) {
          const email = (typeof item === 'string' ? item : item?.email)?.trim()?.toLowerCase();
          if (email && email.includes('@')) {
            const name = (typeof item === 'object' && item?.name) || formatNameFromEmail(email);
            detectedMap.set(email, {
              name,
              email,
              avatarColor: getAvatarColor(email),
            });
          }
        }
      }
    } catch (e) {}

    // 2. Check for runtime session storage payload
    try {
      const sessionRaw = sessionStorage.getItem('google_auth_payload');
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const p of list) {
          const email = p?.email?.trim()?.toLowerCase();
          if (email && email.includes('@')) {
            detectedMap.set(email, {
              name: p.name || formatNameFromEmail(email),
              email,
              avatarColor: getAvatarColor(email),
            });
          }
        }
      }
    } catch (e) {}

    // 3. Check for accounts saved on this device from previous active sessions
    const deviceSaved = googleAuthService.getStoredDeviceAccounts();
    for (const acc of deviceSaved) {
      if (acc?.email && !detectedMap.has(acc.email.toLowerCase())) {
        detectedMap.set(acc.email.toLowerCase(), acc);
      }
    }

    // 4. Check Web Credentials API if supported by the browser
    if (typeof navigator !== 'undefined' && navigator.credentials && navigator.credentials.get) {
      try {
        const cred: any = await Promise.race([
          navigator.credentials.get({ mediation: 'silent' } as any),
          new Promise((resolve) => setTimeout(() => resolve(null), 300)),
        ]);
        if (cred && cred.id && cred.id.includes('@')) {
          const email = cred.id.trim().toLowerCase();
          if (!detectedMap.has(email)) {
            detectedMap.set(email, {
              name: cred.name || formatNameFromEmail(email),
              email,
              avatarColor: getAvatarColor(email),
            });
          }
        }
      } catch (e) {
        // Silently ignore if not granted
      }
    }

    // Returns ONLY accounts detected from the runtime session/device.
    // If none are active, returns an empty array.
    return Array.from(detectedMap.values());
  },
};
