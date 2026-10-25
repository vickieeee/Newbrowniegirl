import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { SIGNATURE_BROWNIES, BAKING_CLASSES, BrownieItem, BakingClassInfo } from '../data/brownies';
import { formatRupee, OFFICIAL_INSTAGRAM_URL } from '../utils/formatters';
import {
  AdminUser,
  getStoredAdmins,
  saveStoredAdmins,
  isAuthorizedAdmin,
  isValidEmail,
  OFFICIAL_OWNER_EMAIL,
  CO_ADMIN_EMAIL,
} from '../data/adminManagement';

export interface SiteSettings {
  phone: string;
  phoneRaw: string;
  whatsappNumber: string;
  email: string;
  instagramId: string;
  facebookId?: string;
  aboutImage: string;
  heroSlide1Image: string;
  heroSlide2Image: string;
  heroSlide3Image: string;
  updatedAt?: string;
}

export interface AchievementSettings {
  stat1Value: string;
  stat1Label: string;
  stat1Desc: string;
  stat2Value: string;
  stat2Label: string;
  stat2Desc: string;
  stat3Value: string;
  stat3Label: string;
  stat3Desc: string;
  stat4Value: string;
  stat4Label: string;
  stat4Desc: string;
  award1Title: string;
  award1Org: string;
  award1Note: string;
  award2Title: string;
  award2Org: string;
  award2Note: string;
  award3Title: string;
  award3Org: string;
  award3Note: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  phone: '(555) 392-CAKE',
  phoneRaw: '+15553922253',
  whatsappNumber: '7339651529',
  email: 'preethipreethu712@gmail.com',
  instagramId: OFFICIAL_INSTAGRAM_URL,
  aboutImage: 'https://images.unsplash.com/photo-1556911073-38141963c9e0?q=85&w=1600&auto=format&fit=crop',
  heroSlide1Image: 'https://images.unsplash.com/photo-1556911073-38141963c9e0?q=85&w=2400&auto=format&fit=crop',
  heroSlide2Image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=85&w=2400&auto=format&fit=crop',
  heroSlide3Image: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?q=85&w=2400&auto=format&fit=crop',
};

export const DEFAULT_ACHIEVEMENTS: AchievementSettings = {
  stat1Value: '50,000+',
  stat1Label: 'Artisan Brownies Baked',
  stat1Desc: 'Handcrafted in small batches with 100% pure cocoa butter chocolate.',
  stat2Value: '1,200+',
  stat2Label: 'Baking Class Graduates',
  stat2Desc: 'Students who mastered fudgy centers and crackly crusts in our studio.',
  stat3Value: '4.9 / 5.0',
  stat3Label: 'Average Customer Rating',
  stat3Desc: 'From over 3,500+ verified dessert lovers and pastry enthusiasts.',
  stat4Value: '2025 Winner',
  stat4Label: 'Best Artisan Bakery',
  stat4Desc: 'Awarded by the National Pastry & Confectionery Guild for recipe excellence.',
  award1Title: 'Golden Whisk Pastry Award',
  award1Org: 'Artisan Bakery Association 2025',
  award1Note: 'Voted #1 Handcrafted Brownie in the Country',
  award2Title: 'Certified Fair-Trade Partner',
  award2Org: 'Valrhona & Belgian Cocoa Alliance',
  award2Note: '100% Sustainable Single-Origin Cocoa Sourcing',
  award3Title: 'Culinary Masterclass Excellence',
  award3Org: 'Metropolitan Cooking Guild',
  award3Note: 'Top Rated Hands-On Baking Workshop',
};

const STORAGE_KEYS = {
  SETTINGS: 'browinegirl_site_settings',
  ACHIEVEMENTS: 'browinegirl_achievements',
  MENU: 'browinegirl_menu_items',
  CLASSES: 'browinegirl_classes',
  DELETED_CLASSES: 'browinegirl_deleted_classes',
  CUSTOM: 'browinegirl_custom_items',
};

const getDeletedClassIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_CLASSES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

interface ContentContextType {
  settings: SiteSettings;
  achievements: AchievementSettings;
  menuItems: BrownieItem[];
  bakingClasses: BakingClassInfo[];
  customBrownies: BrownieItem[];
  isAdmin: boolean;
  isDemoAdmin: boolean;
  authorizedAdmins: AdminUser[];
  addAdmin: (email: string, name?: string) => Promise<{ success: boolean; message: string }>;
  removeAdmin: (email: string) => Promise<{ success: boolean; message: string }>;
  isAuthorizedAdmin: (email?: string | null) => boolean;
  toggleDemoAdmin: () => void;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  updateAchievements: (newAchievements: Partial<AchievementSettings>) => Promise<void>;
  addMenuItem: (item: Omit<BrownieItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<BrownieItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addClass: (cls: Omit<BakingClassInfo, 'id'>) => Promise<void>;
  updateClass: (id: string, cls: Partial<BakingClassInfo>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addCustomBrownie: (item: Omit<BrownieItem, 'id'>) => Promise<void>;
  updateCustomBrownie: (id: string, item: Partial<BrownieItem>) => Promise<void>;
  deleteCustomBrownie: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();

  // Initialize from LocalStorage or defaults
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          !parsed.email ||
          parsed.email === 'hello@browniegirlcakes.com' ||
          parsed.email === 'hello@browinegirlcakes.com'
        ) {
          parsed.email = 'preethipreethu712@gmail.com';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read cached settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [achievements, setAchievements] = useState<AchievementSettings>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (cached) return { ...DEFAULT_ACHIEVEMENTS, ...JSON.parse(cached) };
    } catch (e) {
      console.warn('Could not read cached achievements', e);
    }
    return DEFAULT_ACHIEVEMENTS;
  });

  const [menuItems, setMenuItems] = useState<BrownieItem[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.MENU);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: BrownieItem) => ({
            ...item,
            price: formatRupee(item.price),
          }));
        }
      }
    } catch (e) {
      console.warn('Could not read cached menu items', e);
    }
    return SIGNATURE_BROWNIES;
  });

  const [bakingClasses, setBakingClasses] = useState<BakingClassInfo[]>(() => {
    const deletedIds = getDeletedClassIds();
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((c: BakingClassInfo) => !deletedIds.includes(c.id))
            .map((c: BakingClassInfo) => ({
              ...c,
              price: formatRupee(c.price),
              dates: Array.isArray(c.dates) ? c.dates : [],
            }));
        }
      }
    } catch (e) {
      console.warn('Could not read cached classes', e);
    }
    return BAKING_CLASSES.filter((c) => !deletedIds.includes(c.id));
  });

  const [customBrownies, setCustomBrownies] = useState<BrownieItem[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CUSTOM);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read cached custom items', e);
    }
    return SIGNATURE_BROWNIES;
  });

  const [isDemoAdmin, setIsDemoAdmin] = useState<boolean>(true); // Accessible in applet environment
  const [authorizedAdmins, setAuthorizedAdmins] = useState<AdminUser[]>(getStoredAdmins);

  const isSuperAdminEmail =
    user?.email?.toLowerCase() === OFFICIAL_OWNER_EMAIL.toLowerCase() ||
    user?.email?.toLowerCase() === CO_ADMIN_EMAIL.toLowerCase() ||
    isAuthorizedAdmin(user?.email);
  const isAdminRole = userProfile?.role === 'admin';
  const isAdmin = isSuperAdminEmail || isAdminRole || isDemoAdmin;

  // Sync authorized admins from Firestore
  useEffect(() => {
    const adminDocRef = doc(db, 'settings', 'admin_access');
    const unsubscribe = onSnapshot(
      adminDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.admins) && data.admins.length > 0) {
            saveStoredAdmins(data.admins);
            setAuthorizedAdmins(getStoredAdmins());
          }
        }
      },
      (error) => {
        console.warn('Admin access sync fallback:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // 1. Sync Settings from Firestore
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = { ...DEFAULT_SETTINGS, ...docSnap.data() } as SiteSettings;
          if (
            !remoteData.email ||
            remoteData.email === 'hello@browniegirlcakes.com' ||
            remoteData.email === 'hello@browinegirlcakes.com'
          ) {
            remoteData.email = 'preethipreethu712@gmail.com';
          }
          setSettings(remoteData);
          try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remoteData));
          } catch {}
        }
      },
      (error) => {
        console.warn('Settings snapshot fallback:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Sync Achievements from Firestore
  useEffect(() => {
    const achDocRef = doc(db, 'settings', 'achievements');
    const unsubscribe = onSnapshot(
      achDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = { ...DEFAULT_ACHIEVEMENTS, ...docSnap.data() } as AchievementSettings;
          setAchievements(remoteData);
          try {
            localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(remoteData));
          } catch {}
        }
      },
      (error) => {
        console.warn('Achievements snapshot fallback:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Sync Menu Items from Firestore
  useEffect(() => {
    const menuColRef = collection(db, 'menu_items');
    const unsubscribe = onSnapshot(
      menuColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: BrownieItem[] = [];
          snapshot.forEach((d) => {
            const raw = d.data() as BrownieItem;
            items.push({
              ...raw,
              id: d.id || raw.id,
              price: formatRupee(raw.price),
            });
          });
          setMenuItems(items);
          try {
            localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(items));
          } catch {}
        }
      },
      (error) => {
        console.warn('Menu snapshot fallback:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Sync Baking Classes from Firestore
  useEffect(() => {
    const classesColRef = collection(db, 'baking_classes');
    const unsubscribe = onSnapshot(
      classesColRef,
      (snapshot) => {
        const deletedIds = getDeletedClassIds();
        if (!snapshot.empty) {
          const clsList: BakingClassInfo[] = [];
          snapshot.forEach((d) => {
            const raw = d.data() as BakingClassInfo;
            const classId = d.id || raw.id;
            if (!deletedIds.includes(classId)) {
              clsList.push({
                ...raw,
                id: classId,
                price: formatRupee(raw.price),
                dates: Array.isArray(raw.dates) ? raw.dates : [],
              });
            }
          });
          setBakingClasses(clsList);
          try {
            localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(clsList));
          } catch {}
        } else {
          // Snapshot is empty: Fallback to signature masterclasses
          const fallback = BAKING_CLASSES.filter((c) => !deletedIds.includes(c.id));
          setBakingClasses(fallback);
          try {
            localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(fallback));
          } catch {}
        }
      },
      (error) => {
        console.warn('Classes snapshot fallback:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 5. Sync Custom Showcase Brownies from Firestore
  useEffect(() => {
    const customColRef = collection(db, 'custom_items');
    const unsubscribe = onSnapshot(
      customColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: BrownieItem[] = [];
          snapshot.forEach((d) => {
            const raw = d.data() as BrownieItem;
            items.push({
              ...raw,
              id: d.id || raw.id,
            });
          });
          setCustomBrownies(items);
          try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(items));
          } catch {}
        }
      },
      (error) => {
        console.warn('Custom items snapshot fallback:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update Settings
  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch {}

    try {
      await setDoc(doc(db, 'settings', 'general'), updated, { merge: true });
    } catch (error) {
      console.warn('Could not save settings to Firestore directly, updated locally:', error);
    }
  };

  // Update Achievements
  const updateAchievements = async (newAchievements: Partial<AchievementSettings>) => {
    const updated = { ...achievements, ...newAchievements };
    setAchievements(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(updated));
    } catch {}

    try {
      await setDoc(doc(db, 'settings', 'achievements'), updated, { merge: true });
    } catch (error) {
      console.warn('Could not save achievements to Firestore directly, updated locally:', error);
    }
  };

  // Menu Management
  const addMenuItem = async (item: Omit<BrownieItem, 'id'>) => {
    const newId = `brownie-${Date.now()}`;
    const fullItem: BrownieItem = { ...item, id: newId };
    const updated = [...menuItems, fullItem];
    setMenuItems(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updated));
    } catch {}

    try {
      await setDoc(doc(db, 'menu_items', newId), item);
    } catch (error) {
      console.warn('Could not persist new menu item to Firestore:', error);
    }
  };

  const updateMenuItem = async (id: string, updatedFields: Partial<BrownieItem>) => {
    const updated = menuItems.map((item) =>
      item.id === id ? { ...item, ...updatedFields } : item
    );
    setMenuItems(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updated));
    } catch {}

    try {
      await setDoc(doc(db, 'menu_items', id), updatedFields, { merge: true });
    } catch (error) {
      console.warn('Could not update menu item in Firestore:', error);
    }
  };

  const deleteMenuItem = async (id: string) => {
    const updated = menuItems.filter((item) => item.id !== id);
    setMenuItems(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updated));
    } catch {}

    try {
      await deleteDoc(doc(db, 'menu_items', id));
    } catch (error) {
      console.warn('Could not delete menu item in Firestore:', error);
    }
  };

  // Class Management
  const addClass = async (cls: Omit<BakingClassInfo, 'id'>) => {
    const newId = `class-${Date.now()}`;
    const fullClass: BakingClassInfo = { ...cls, id: newId };
    const updated = [...bakingClasses, fullClass];
    setBakingClasses(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updated));
    } catch {}

    try {
      await setDoc(doc(db, 'baking_classes', newId), cls);
    } catch (error) {
      console.warn('Could not persist new baking class to Firestore:', error);
    }
  };

  const updateClass = async (id: string, updatedFields: Partial<BakingClassInfo>) => {
    const existing = bakingClasses.find((c) => c.id === id);
    const updatedClass: BakingClassInfo = existing
      ? { ...existing, ...updatedFields }
      : ({ id, ...updatedFields } as BakingClassInfo);

    const updated = bakingClasses.map((c) => (c.id === id ? updatedClass : c));
    setBakingClasses(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updated));
    } catch {}

    try {
      // Save entire merged class object so deleted date slots stay deleted and all fields remain intact
      await setDoc(doc(db, 'baking_classes', id), updatedClass);
    } catch (error) {
      console.warn('Could not update class in Firestore:', error);
    }
  };

  const deleteClass = async (id: string) => {
    // 1. Add to deleted IDs set immediately so snapshot listeners never resurrect it
    const deletedIds = getDeletedClassIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      try {
        localStorage.setItem(STORAGE_KEYS.DELETED_CLASSES, JSON.stringify(deletedIds));
      } catch {}
    }

    // 2. Remove from local state and update local storage
    const updated = bakingClasses.filter((c) => c.id !== id);
    setBakingClasses(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updated));
    } catch {}

    // 3. Delete from Firestore collection
    try {
      await deleteDoc(doc(db, 'baking_classes', id));
    } catch (error) {
      console.warn('Could not delete class in Firestore:', error);
    }
  };

  // Custom Showcase Brownie Management
  const addCustomBrownie = async (item: Omit<BrownieItem, 'id'>) => {
    const newId = `custom-${Date.now()}`;
    const fullItem: BrownieItem = { ...item, id: newId };
    const updated = [...customBrownies, fullItem];
    setCustomBrownies(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(updated));
    } catch {}
    try {
      await setDoc(doc(db, 'custom_items', newId), fullItem);
    } catch (e) {
      console.warn('Could not persist custom item to Firestore:', e);
    }
  };

  const updateCustomBrownie = async (id: string, updatedFields: Partial<BrownieItem>) => {
    const existing = customBrownies.find((b) => b.id === id);
    const updatedItem: BrownieItem = existing
      ? { ...existing, ...updatedFields }
      : ({ id, ...updatedFields } as BrownieItem);

    const updated = customBrownies.map((b) => (b.id === id ? updatedItem : b));
    setCustomBrownies(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(updated));
    } catch {}
    try {
      await setDoc(doc(db, 'custom_items', id), updatedItem);
    } catch (e) {
      console.warn('Could not update custom item in Firestore:', e);
    }
  };

  const deleteCustomBrownie = async (id: string) => {
    const updated = customBrownies.filter((b) => b.id !== id);
    setCustomBrownies(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(updated));
    } catch {}
    try {
      await deleteDoc(doc(db, 'custom_items', id));
    } catch (e) {
      console.warn('Could not delete custom item in Firestore:', e);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.DELETED_CLASSES);
    } catch {}

    setSettings(DEFAULT_SETTINGS);
    setAchievements(DEFAULT_ACHIEVEMENTS);
    setMenuItems(SIGNATURE_BROWNIES);
    setBakingClasses(BAKING_CLASSES);
    setCustomBrownies(SIGNATURE_BROWNIES);

    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(DEFAULT_ACHIEVEMENTS));
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(SIGNATURE_BROWNIES));
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(BAKING_CLASSES));
      localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(SIGNATURE_BROWNIES));
      localStorage.removeItem('browinegirl_local_orders');
      localStorage.removeItem('browinegirl_customer_orders');
      localStorage.removeItem('browinegirl_customer_inquiries');
      localStorage.removeItem('browinegirl_deleted_registrations');
      localStorage.removeItem('browinegirl_deleted_inquiries');
    } catch {}

    try {
      await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
      await setDoc(doc(db, 'settings', 'achievements'), DEFAULT_ACHIEVEMENTS);
      for (const item of SIGNATURE_BROWNIES) {
        await setDoc(doc(db, 'menu_items', item.id), item);
        await setDoc(doc(db, 'custom_items', item.id), item);
      }
    } catch (error) {
      console.warn('Reset sync warning:', error);
    }
  };

  const addAdmin = async (
    email: string,
    name?: string
  ): Promise<{ success: boolean; message: string }> => {
    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (authorizedAdmins.some((a) => a.email.toLowerCase() === clean)) {
      return {
        success: false,
        message: `"${clean}" is already registered as an authorized administrator.`,
      };
    }

    const newAdmin: AdminUser = {
      email: clean,
      name: name?.trim() || clean.split('@')[0],
      role: 'admin',
      addedAt: new Date().toISOString(),
      addedBy: user?.email || 'Bakery Admin',
    };

    const updated = [...authorizedAdmins, newAdmin];
    setAuthorizedAdmins(updated);
    saveStoredAdmins(updated);

    try {
      await setDoc(doc(db, 'settings', 'admin_access'), { admins: updated }, { merge: true });
    } catch (err) {
      console.warn('Could not sync admin to Firestore, saved locally:', err);
    }

    return {
      success: true,
      message: `Successfully granted admin access to ${clean}! They can now sign in at /#admin`,
    };
  };

  const removeAdmin = async (email: string): Promise<{ success: boolean; message: string }> => {
    const clean = email.trim().toLowerCase();
    if (clean === OFFICIAL_OWNER_EMAIL.toLowerCase()) {
      return {
        success: false,
        message: `The primary bakery owner (${OFFICIAL_OWNER_EMAIL}) cannot be removed.`,
      };
    }

    const updated = authorizedAdmins.filter((a) => a.email.toLowerCase() !== clean);
    setAuthorizedAdmins(updated);
    saveStoredAdmins(updated);

    try {
      await setDoc(doc(db, 'settings', 'admin_access'), { admins: updated });
    } catch (err) {
      console.warn('Could not remove admin from Firestore, saved locally:', err);
    }

    return { success: true, message: `Admin access revoked for ${clean}.` };
  };

  const toggleDemoAdmin = () => {
    setIsDemoAdmin((prev) => !prev);
  };

  return (
    <ContentContext.Provider
      value={{
        settings,
        achievements,
        menuItems,
        bakingClasses,
        customBrownies,
        isAdmin,
        isDemoAdmin,
        authorizedAdmins,
        addAdmin,
        removeAdmin,
        isAuthorizedAdmin,
        toggleDemoAdmin,
        updateSettings,
        updateAchievements,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addClass,
        updateClass,
        deleteClass,
        addCustomBrownie,
        updateCustomBrownie,
        deleteCustomBrownie,
        resetToDefaults,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
