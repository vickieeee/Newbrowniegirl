export interface AdminUser {
  email: string;
  name: string;
  role: 'owner' | 'admin';
  addedAt: string;
  addedBy: string;
}

export const OFFICIAL_OWNER_EMAIL = 'preethipreethu712@gmail.com';
export const CO_ADMIN_EMAIL = 'vigneshsivan2001@gmail.com';

export const DEFAULT_ADMINS: AdminUser[] = [
  {
    email: OFFICIAL_OWNER_EMAIL,
    name: 'Preethi (Official Owner)',
    role: 'owner',
    addedAt: '2025-01-01T00:00:00.000Z',
    addedBy: 'System Master',
  },
  {
    email: CO_ADMIN_EMAIL,
    name: 'Vignesh (Co-Admin)',
    role: 'admin',
    addedAt: '2025-01-01T00:00:00.000Z',
    addedBy: 'System Master',
  },
];

const STORAGE_KEY_ADMINS = 'browinegirl_admin_list';

export function getStoredAdmins(): AdminUser[] {
  if (typeof window === 'undefined') return DEFAULT_ADMINS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMINS);
    if (raw) {
      const parsed: AdminUser[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure official owner is always present and marked as owner
        const hasOwner = parsed.some(
          (a) => a.email.toLowerCase() === OFFICIAL_OWNER_EMAIL.toLowerCase()
        );
        if (!hasOwner) {
          parsed.unshift(DEFAULT_ADMINS[0]);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored admin list:', err);
  }

  // Fallback to default list & save
  try {
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(DEFAULT_ADMINS));
  } catch {}

  return DEFAULT_ADMINS;
}

export function saveStoredAdmins(admins: AdminUser[]): void {
  if (typeof window === 'undefined') return;

  // Guarantee official owner cannot be lost
  const hasOwner = admins.some(
    (a) => a.email.toLowerCase() === OFFICIAL_OWNER_EMAIL.toLowerCase()
  );
  const safeList = hasOwner ? admins : [DEFAULT_ADMINS[0], ...admins];

  try {
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(safeList));
  } catch (err) {
    console.warn('Error saving admin list to localStorage:', err);
  }
}

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();

  if (
    clean === OFFICIAL_OWNER_EMAIL.toLowerCase() ||
    clean === CO_ADMIN_EMAIL.toLowerCase()
  ) {
    return true;
  }

  const list = getStoredAdmins();
  return list.some((a) => a.email.toLowerCase() === clean);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
