/**
 * Official Bakery Instagram Link requested by user
 */
export const OFFICIAL_INSTAGRAM_URL = 'https://www.instagram.com/browniegirlcakes?exln=dTU4eXBuMjNmYmJr';

/**
 * Resolves Instagram setting to a valid working URL.
 * Supports:
 * - Full URL: returns as is
 * - Handle with or without @: formats properly
 * - Default/browniegirlcakes/browinegirlcakes: returns the exact official link with parameters
 */
export function getInstagramUrl(setting?: string): string {
  if (!setting) return OFFICIAL_INSTAGRAM_URL;
  const trimmed = setting.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, '');
  if (!clean || clean.toLowerCase() === 'browniegirlcakes' || clean.toLowerCase() === 'browinegirlcakes') {
    return OFFICIAL_INSTAGRAM_URL;
  }
  return `https://www.instagram.com/${clean}`;
}

/**
 * Converts any price string or numeric value into Indian Rupees (₹)
 * Examples:
 * "$4.50 / piece" -> "₹199 / piece"
 * "$85 / person" -> "₹1,999 / person"
 * "24" -> "₹499"
 * "$50.00" -> "₹1,048"
 */
export function formatRupee(priceStr: string | number): string {
  if (priceStr === null || priceStr === undefined) return '₹199';
  const str = String(priceStr).trim();
  if (!str) return '₹199';

  // Already in rupees
  if (str.includes('₹') || str.includes('Rs') || str.includes('INR')) {
    return str;
  }

  // Common conversions from default dollar seed values
  if (str.includes('$4.50')) return str.replace('$4.50', '₹199');
  if (str.includes('$5.00')) return str.replace('$5.00', '₹229');
  if (str.includes('$5.25')) return str.replace('$5.25', '₹249');
  if (str.includes('$5.50')) return str.replace('$5.50', '₹259');
  if (str.includes('$24.00') || str.includes('$24')) return str.replace(/\$24(\.00)?/, '₹499');
  if (str.includes('$26.00') || str.includes('$26')) return str.replace(/\$26(\.00)?/, '₹549');
  if (str.includes('$27.00') || str.includes('$27')) return str.replace(/\$27(\.00)?/, '₹579');
  if (str.includes('$28.00') || str.includes('$28')) return str.replace(/\$28(\.00)?/, '₹599');
  if (str.includes('$48.00') || str.includes('$48')) return str.replace(/\$48(\.00)?/, '₹999');
  if (str.includes('$50.00') || str.includes('$50')) return str.replace(/\$50(\.00)?/, '₹1,048');
  if (str.includes('$52.00') || str.includes('$52')) return str.replace(/\$52(\.00)?/, '₹1,098');
  if (str.includes('$74.00') || str.includes('$74')) return str.replace(/\$74(\.00)?/, '₹1,499');
  if (str.includes('$75')) return str.replace('$75', '₹1,499');
  if (str.includes('$85')) return str.replace('$85', '₹1,999');
  if (str.includes('$95')) return str.replace('$95', '₹2,499');

  // Generic dollar replacement
  if (str.includes('$')) {
    return str.replace('$', '₹');
  }

  return `₹${str}`;
}

/**
 * Compresses an image file selected from local device storage using HTML5 Canvas.
 * Returns an optimized Base64 Data URL (~60-150KB) that renders instantly and fits
 * within Firestore & LocalStorage limits.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to read image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Formats a clean, human-readable name from an email address
 * e.g., "preethipreethu712@gmail.com" -> "Preethi Preethu"
 * e.g., "john.doe@example.com" -> "John Doe"
 */
export function formatNameFromEmail(email?: string | null): string {
  if (!email) return '';
  const raw = email.split('@')[0] || '';
  // Replace numbers, dots, dashes, underscores with space
  const clean = raw.replace(/[0-9._-]+/g, ' ').trim();
  if (clean.length >= 2) {
    return clean
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  // If only numbers or very short, capitalize raw part
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
}

/**
 * Resolves the most accurate and up-to-date display name for a logged-in user.
 * Avoids dummy fallback names like 'Baking Enthusiast' or 'User'.
 */
export function getEffectiveUserName(
  user: { displayName?: string | null; email?: string | null } | null | undefined,
  profile?: { displayName?: string | null; email?: string | null } | null | undefined
): string {
  if (user?.displayName && user.displayName.trim() && user.displayName !== 'Baking Enthusiast') {
    return user.displayName.trim();
  }
  if (profile?.displayName && profile.displayName.trim() && profile.displayName !== 'Baking Enthusiast') {
    return profile.displayName.trim();
  }
  if (user?.email) {
    return formatNameFromEmail(user.email);
  }
  if (profile?.email) {
    return formatNameFromEmail(profile.email);
  }
  return '';
}
