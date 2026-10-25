import React, { useState, useEffect } from 'react';
import {
  useContent,
  SiteSettings,
  AchievementSettings,
  DEFAULT_SETTINGS,
} from '../context/ContentContext';
import { BrownieItem, BakingClassInfo } from '../data/brownies';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  Settings,
  Image as ImageIcon,
  UtensilsCrossed,
  Calendar,
  Trophy,
  Phone,
  Mail,
  Instagram,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Users,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  Gift,
  Clock,
  MapPin,
  FolderUp,
  Upload,
  Eye,
  EyeOff,
  CheckCheck,
  Filter,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Search,
  MessageCircle,
  BarChart3,
  CalendarDays,
  UserPlus,
  Copy,
  Key,
  Cake,
} from 'lucide-react';
import {
  compressImageFile,
  OFFICIAL_INSTAGRAM_URL,
  getInstagramUrl,
  formatRupee,
} from '../utils/formatters';
import { OFFICIAL_OWNER_EMAIL } from '../data/adminManagement';

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
  onViewWebsite: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthInfo {
  key: string;
  label: string;
  shortLabel: string;
  year: number;
  monthIndex: number;
}

const parseBookingMonth = (preferredDate?: string, createdAt?: string): MonthInfo => {
  const currentYear = new Date().getFullYear();
  let matchedMonthIdx = -1;
  let year = currentYear;

  if (preferredDate) {
    const yrMatch = preferredDate.match(/\b(202[4-9])\b/);
    if (yrMatch) year = parseInt(yrMatch[1], 10);

    const lower = preferredDate.toLowerCase();
    for (let i = 0; i < MONTH_NAMES.length; i++) {
      const full = MONTH_NAMES[i].toLowerCase();
      const short = full.slice(0, 3);
      if (lower.includes(full) || lower.includes(short)) {
        matchedMonthIdx = i;
        break;
      }
    }
  }

  if (matchedMonthIdx === -1 && createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        matchedMonthIdx = d.getMonth();
        year = d.getFullYear();
      }
    } catch {
      // ignore
    }
  }

  if (matchedMonthIdx === -1) {
    const now = new Date();
    matchedMonthIdx = now.getMonth();
    year = now.getFullYear();
  }

  const label = `${MONTH_NAMES[matchedMonthIdx]} ${year}`;
  const shortLabel = `${MONTH_NAMES[matchedMonthIdx].slice(0, 3)} ${year}`;
  const key = `${year}-${String(matchedMonthIdx + 1).padStart(2, '0')}`;

  return { key, label, shortLabel, year, monthIndex: matchedMonthIdx };
};

const IMAGE_PRESETS = {
  hero1: [
    {
      label: 'Warm Kitchen Artisan Baker',
      url: 'https://images.unsplash.com/photo-1556911073-38141963c9e0?q=85&w=2400&auto=format&fit=crop',
    },
    {
      label: 'Pastry Chef Pouring Chocolate',
      url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=85&w=2400&auto=format&fit=crop',
    },
    {
      label: 'Baker Whisking Brownie Batter',
      url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=85&w=2400&auto=format&fit=crop',
    },
  ],
  hero2: [
    {
      label: 'Ultra Fudgy Brownie Stack',
      url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=85&w=2400&auto=format&fit=crop',
    },
    {
      label: 'Decadent Ganache Drizzle',
      url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=85&w=2400&auto=format&fit=crop',
    },
    {
      label: 'Crusty Dark Cocoa Squares',
      url: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?q=85&w=2400&auto=format&fit=crop',
    },
  ],
  hero3: [
    {
      label: 'Clean Studio Baking Workshop',
      url: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?q=85&w=2400&auto=format&fit=crop',
    },
    {
      label: 'Students Learning Pastry Art',
      url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=85&w=2400&auto=format&fit=crop',
    },
    {
      label: 'Baking Table with Cocoa & Trays',
      url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=85&w=2400&auto=format&fit=crop',
    },
  ],
  about: [
    {
      label: 'Elena in Bakery Kitchen',
      url: 'https://images.unsplash.com/photo-1556911073-38141963c9e0?q=85&w=1600&auto=format&fit=crop',
    },
    {
      label: 'Master Chocolatier at Counter',
      url: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=85&w=1600&auto=format&fit=crop',
    },
    {
      label: 'Artisan Pastry Maker Smile',
      url: 'https://images.unsplash.com/photo-1607637508097-4089cfa6d5e7?q=85&w=1600&auto=format&fit=crop',
    },
  ],
};

interface LocalImageUploaderProps {
  label?: string;
  onImageSelected: (dataUrl: string) => void;
  className?: string;
}

const LocalImageUploader: React.FC<LocalImageUploaderProps> = ({
  label = 'Upload from Device',
  onImageSelected,
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (e.g. JPG, PNG, WebP).');
      return;
    }

    try {
      setIsProcessing(true);
      // Automatically compress and resize client-side to keep under 150KB for fast Firestore and localStorage sync
      const compressedDataUrl = await compressImageFile(file, 1400, 0.82);
      onImageSelected(compressedDataUrl);
    } catch (err) {
      console.error('Local photo processing error:', err);
      alert('Failed to process image. Please try another photo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => fileInputRef.current?.click()}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B211B] hover:bg-[#23120E] text-[#E8D6C3] hover:text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 ${className}`}
        title="Upload photo directly from local device storage"
      >
        <FolderUp className="w-3.5 h-3.5 text-[#E5A962]" />
        <span>{isProcessing ? 'Optimizing Photo...' : label}</span>
      </button>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminEmail,
  onLogout,
  onViewWebsite,
}) => {
  const {
    settings,
    achievements,
    menuItems,
    bakingClasses,
    customBrownies,
    authorizedAdmins,
    addAdmin,
    removeAdmin,
    isAuthorizedAdmin,
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
  } = useContent();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'contact' | 'images' | 'menu' | 'classes' | 'custom' | 'achievements' | 'bookings' | 'admins'
  >('overview');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Draft states
  const [contactForm, setContactForm] = useState<SiteSettings>(settings);
  const [imageForm, setImageForm] = useState<SiteSettings>(settings);
  const [achForm, setAchForm] = useState<AchievementSettings>(achievements);

  const [expandedBrownieId, setExpandedBrownieId] = useState<string | null>(null);
  const [expandedCustomBrownieId, setExpandedCustomBrownieId] = useState<string | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [classDateInputs, setClassDateInputs] = useState<Record<string, string>>({});

  // Inline deletion confirmation states (completely bypasses blocked window.confirm in iframes)
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [deletingBrownieId, setDeletingBrownieId] = useState<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);
  const [deletingInquiryId, setDeletingInquiryId] = useState<string | null>(null);
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<string | null>(null);
  const [confirmingResetDefaults, setConfirmingResetDefaults] = useState(false);

  // Persistent deleted tracking so deleted records never resurrect in snapshot listener
  const [deletedInquiryIds, setDeletedInquiryIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('browinegirl_deleted_inquiries') || '[]');
    } catch {
      return [];
    }
  });

  const [deletedRegistrationIds, setDeletedRegistrationIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('browinegirl_deleted_registrations') || '[]');
    } catch {
      return [];
    }
  });

  // Customer order (inquiries) filters & search
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [inquirySearch, setInquirySearch] = useState('');

  // Customer bookings monthly early assessment states
  const [selectedBookingMonth, setSelectedBookingMonth] = useState<string>('all');
  const [bookingViewMode, setBookingViewMode] = useState<'monthly_assess' | 'list'>('monthly_assess');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'registered' | 'waitlist' | 'cancelled'>('all');
  const [bookingsSubTab, setBookingsSubTab] = useState<'all' | 'bookings' | 'inquiries'>('all');

  // Multi-Admin Management States
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [revokingAdminEmail, setRevokingAdminEmail] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionError(null);
    if (!newAdminEmail.trim()) {
      setAdminActionError('Please enter an email address.');
      return;
    }

    try {
      setIsSubmittingAdmin(true);
      const res = await addAdmin(newAdminEmail, newAdminName);
      if (res.success) {
        triggerSuccess(res.message);
        setNewAdminEmail('');
        setNewAdminName('');
      } else {
        setAdminActionError(res.message);
      }
    } catch (err: any) {
      setAdminActionError(err?.message || 'Failed to add administrator.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (email: string) => {
    try {
      const res = await removeAdmin(email);
      setRevokingAdminEmail(null);
      if (res.success) {
        triggerSuccess(res.message);
      } else {
        alert(res.message);
      }
    } catch (err) {
      setRevokingAdminEmail(null);
      console.warn('Revoke admin error:', err);
    }
  };

  useEffect(() => {
    setContactForm(settings);
    setImageForm(settings);
  }, [settings]);

  useEffect(() => {
    setAchForm(achievements);
  }, [achievements]);

  // Real-time Firestore records
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [allInquiries, setAllInquiries] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubRegs = onSnapshot(
      collection(db, 'class_registrations'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        const storedDeleted = (() => {
          try {
            return JSON.parse(localStorage.getItem('browinegirl_deleted_registrations') || '[]');
          } catch {
            return [];
          }
        })();
        try {
          const localAdmin = JSON.parse(localStorage.getItem('browinegirl_local_admin_registrations') || '[]');
          localAdmin.forEach((lr: any) => {
            if (!list.some((item) => item.id === lr.id)) {
              list.push(lr);
            }
          });
        } catch {}
        setAllRegistrations(list.filter((reg) => !storedDeleted.includes(reg.id)));
      },
      (err) => {
        console.warn('Registrations error:', err);
        try {
          const localAdmin = JSON.parse(localStorage.getItem('browinegirl_local_admin_registrations') || '[]');
          const storedDeleted = JSON.parse(localStorage.getItem('browinegirl_deleted_registrations') || '[]');
          setAllRegistrations(localAdmin.filter((reg: any) => !storedDeleted.includes(reg.id)));
        } catch {}
      }
    );

    const unsubInqs = onSnapshot(
      collection(db, 'inquiries'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        const storedDeleted = (() => {
          try {
            return JSON.parse(localStorage.getItem('browinegirl_deleted_inquiries') || '[]');
          } catch {
            return [];
          }
        })();
        setAllInquiries(list.filter((inq) => !storedDeleted.includes(inq.id)));
      },
      (err) => console.warn('Inquiries error:', err)
    );

    return () => {
      unsubRegs();
      unsubInqs();
    };
  }, []);

  // New custom showcase brownie state
  const [isAddingCustomBrownie, setIsAddingCustomBrownie] = useState(false);
  const [newCustomBrownie, setNewCustomBrownie] = useState<Omit<BrownieItem, 'id'>>({
    name: '',
    subtitle: '',
    description: '',
    price: '',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=85&w=800&auto=format&fit=crop',
    badge: 'Artisan Custom',
    cocoaPercentage: '70% Dark',
    flavorNotes: ['Single Origin Belgian Cocoa', 'Flaky Sea Salt'],
  });

  // New brownie state
  const [isAddingBrownie, setIsAddingBrownie] = useState(false);
  const [newBrownie, setNewBrownie] = useState<Omit<BrownieItem, 'id'>>({
    name: '',
    subtitle: '',
    description: '',
    price: '₹199 / piece',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1200&auto=format&fit=crop',
    badge: 'Seasonal Special',
    cocoaPercentage: '72% Dark',
    flavorNotes: ['Madagascar Vanilla', 'Rich Cocoa nibs'],
  });

  // New class state
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClass, setNewClass] = useState<Omit<BakingClassInfo, 'id'>>({
    title: '',
    level: 'Beginner to Intermediate',
    duration: '2.5 Hours',
    price: '₹1,999 / person',
    description: '',
    dates: ['Every Tuesday @ 6:00 PM (Live Online)', 'Saturday @ 11:00 AM (In-Studio)'],
  });

  const triggerSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  // Customer order (inquiries) deletion & mark-as-read handlers
  const handleDeleteInquiry = async (inquiryId: string, customerName?: string) => {
    try {
      const updated = [...deletedInquiryIds, inquiryId];
      setDeletedInquiryIds(updated);
      localStorage.setItem('browinegirl_deleted_inquiries', JSON.stringify(updated));
      setAllInquiries((prev) => prev.filter((item) => item.id !== inquiryId));
      setDeletingInquiryId(null);
      await deleteDoc(doc(db, 'inquiries', inquiryId));
      triggerSuccess(`Permanently deleted customer order from ${customerName || 'customer'}`);
    } catch (err) {
      console.warn('Firestore delete inquiry error (local removal preserved):', err);
      setDeletingInquiryId(null);
      triggerSuccess(`Deleted customer order from ${customerName || 'customer'}`);
    }
  };

  const handleToggleInquiryRead = async (inq: any) => {
    const isCurrentlyRead = inq.status === 'read' || inq.isRead === true;
    const nextStatus = isCurrentlyRead ? 'new' : 'read';
    const nextIsRead = !isCurrentlyRead;

    setAllInquiries((prev) =>
      prev.map((item) =>
        item.id === inq.id
          ? {
              ...item,
              status: nextStatus,
              isRead: nextIsRead,
              readAt: nextIsRead ? new Date().toISOString() : null,
            }
          : item
      )
    );

    try {
      await updateDoc(doc(db, 'inquiries', inq.id), {
        status: nextStatus,
        isRead: nextIsRead,
        readAt: nextIsRead ? new Date().toISOString() : null,
      });
      triggerSuccess(nextIsRead ? 'Order marked as Read ✓' : 'Order marked as New / Unread');
    } catch (err) {
      console.warn('Firestore updateDoc error:', err);
      triggerSuccess(nextIsRead ? 'Order marked as Read (local)' : 'Order marked as Unread (local)');
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    const isRead = newStatus === 'read' || newStatus === 'replied' || newStatus === 'closed';
    setAllInquiries((prev) =>
      prev.map((item) =>
        item.id === inquiryId
          ? {
              ...item,
              status: newStatus,
              isRead,
              readAt: isRead ? new Date().toISOString() : null,
            }
          : item
      )
    );

    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        status: newStatus,
        isRead,
        readAt: isRead ? new Date().toISOString() : null,
      });
      triggerSuccess(`Order status updated to "${newStatus}"`);
    } catch (err) {
      console.warn('Firestore error updating inquiry status:', err);
    }
  };

  const handleMarkAllInquiriesAsRead = async () => {
    const unread = allInquiries.filter((inq) => inq.status !== 'read' && !inq.isRead);
    if (unread.length === 0) {
      triggerSuccess('All customer orders are already marked as read!');
      return;
    }

    setAllInquiries((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'read',
        isRead: true,
        readAt: new Date().toISOString(),
      }))
    );

    try {
      await Promise.all(
        unread.map((inq) =>
          updateDoc(doc(db, 'inquiries', inq.id), {
            status: 'read',
            isRead: true,
            readAt: new Date().toISOString(),
          })
        )
      );
      triggerSuccess(`Marked ${unread.length} customer order(s) as read!`);
    } catch (err) {
      console.warn('Firestore bulk update error:', err);
      triggerSuccess(`Marked ${unread.length} customer order(s) as read`);
    }
  };

  // Customer booking deletion handler
  const handleDeleteRegistration = async (regId: string, studentName?: string) => {
    try {
      const updated = [...deletedRegistrationIds, regId];
      setDeletedRegistrationIds(updated);
      localStorage.setItem('browinegirl_deleted_registrations', JSON.stringify(updated));
      setAllRegistrations((prev) => prev.filter((item) => item.id !== regId));
      setDeletingRegistrationId(null);
      await deleteDoc(doc(db, 'class_registrations', regId));
      triggerSuccess(`Permanently removed booking for ${studentName || 'student'}`);
    } catch (err) {
      console.warn('Firestore delete registration error (local removal preserved):', err);
      setDeletingRegistrationId(null);
      triggerSuccess(`Removed booking for ${studentName || 'student'}`);
    }
  };

  // Sample seeders for testing
  const handleAddSampleBooking = async (monthName: string, year = 2026) => {
    const sampleNames = ['Aarav Sharma', 'Priya Menon', 'Kavita Patel', 'Rohan Iyer', 'Ananya Deshmukh'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomClass = bakingClasses[Math.floor(Math.random() * bakingClasses.length)] || {
      title: 'The Ultimate Fudgy Brownie Masterclass',
    };
    const sampleId = `sample_reg_${Date.now()}`;
    const newReg = {
      id: sampleId,
      userId: `user_${Date.now()}`,
      userName: randomName,
      userEmail: `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
      className: randomClass.title,
      preferredDate: `Saturday, ${monthName} 14, ${year} @ 10:00 AM`,
      notes: 'Gift booking from family; wants to master shiny crinkly crust technique.',
      status: 'registered',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'class_registrations', newReg.id), newReg);
      triggerSuccess(`Added test booking for ${monthName} ${year} (${randomName})`);
    } catch {
      setAllRegistrations((prev) => [newReg, ...prev]);
      triggerSuccess(`Added test booking for ${monthName} ${year}`);
    }
  };

  const handleAddSampleInquiry = async () => {
    const sampleInquiry = {
      id: `sample_inq_${Date.now()}`,
      userId: `guest_${Date.now()}`,
      userName: 'Siddharth Varma',
      userEmail: 'siddharth.varma@example.com',
      userPhone: '9840123456',
      subject: 'Custom Order Inquiry: Corporate Gifting & Celebration Boxes',
      message:
        'Hello Elena,\n\nEvent Type: Corporate Anniversary\nBatch Size: 80 Artisan Pieces\nEvent Date: Nov 20, 2026\nSelected Flavors: Signature Gold Flake Ganache, 74% Roasted Sesame Tahini Swirl, Aged Bourbon & Walnut.\n\nWe need individually boxed hampers with personalized gold ribbon branding.',
      status: 'new',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'inquiries', sampleInquiry.id), sampleInquiry);
      triggerSuccess('Added test custom order inquiry!');
    } catch {
      setAllInquiries((prev) => [sampleInquiry, ...prev]);
      triggerSuccess('Added test custom order inquiry');
    }
  };

  return (
    <div className="min-h-screen bg-[#2A1612] text-[#F8F0E5] flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-[#1F0F0C] border-b border-[#3B211B] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8D6C3]"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-[#C47B55] flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#F8F0E5]">
                BrowineGirlCakes Admin Dashboard
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#E5A962] text-[#23120E]">
                Authenticated
              </span>
            </div>
            <p className="text-[11px] text-[#E8D6C3]/70 hidden sm:block">
              Logged in as: <strong className="text-white">{adminEmail}</strong> &bull; Changes update public website immediately
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {confirmingResetDefaults ? (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/80 border border-red-500 text-xs text-white">
              <span className="font-bold text-[11px]">Reset all to defaults?</span>
              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                  setConfirmingResetDefaults(false);
                  triggerSuccess('Reset to default bakery content successfully!');
                }}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[10px] cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmingResetDefaults(false)}
                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded font-semibold text-[10px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingResetDefaults(true)}
              title="Reset to factory defaults"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-[#E8D6C3] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}

          {/* View Live Storefront Button */}
          <button
            onClick={onViewWebsite}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer border border-[#C47B55]/40"
          >
            <Globe className="w-4 h-4 text-[#C47B55]" />
            <span className="hidden sm:inline">View Public Website</span>
            <span className="sm:hidden">Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#E8D6C3]/60" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-700/50 text-red-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Sign out of Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Save Notification Banner */}
      {saveSuccess && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between sticky top-[61px] z-30 animate-in slide-in-from-top-2 shadow-md">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            {saveSuccess}
          </span>
          <span className="text-[11px] text-emerald-100 font-mono">Synced to Live Website</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside
          className={`${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } fixed md:static inset-y-0 left-0 top-[61px] z-30 w-64 bg-[#1F0F0C] border-r border-[#3B211B] flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shrink-0`}
        >
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#C47B55]">
              Management Navigation
            </div>

            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & Statistics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('images');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'images'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Hero & Section Images</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('contact');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'contact'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone, Email & Socials</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('menu');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span className="flex-1 text-left">Brownie Menu & Prices</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10">
                {menuItems.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('classes');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="flex-1 text-left">Online Class Times</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10">
                {bakingClasses.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('achievements');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'achievements'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Achievements Section</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('bookings');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="flex-1 text-left">Customer Bookings</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10">
                {allRegistrations.length + allInquiries.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('custom');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span className="flex-1 text-left">Custom Showcase</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-bold">
                {customBrownies.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('admins');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'admins'
                  ? 'bg-[#C47B55] text-white shadow-md'
                  : 'text-[#E8D6C3]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#E5A962]" />
              <span className="flex-1 text-left">Admin Access & Team</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 font-bold">
                {authorizedAdmins.length}
              </span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#3B211B] space-y-2">
            <div className="p-3 bg-white/5 rounded-xl text-xs space-y-1">
              <p className="text-[#E8D6C3]/60 text-[10px] uppercase font-bold tracking-wider">
                Current URL Route
              </p>
              <p className="text-[#F8F0E5] font-mono text-[11px] truncate">
                /admin (Dedicated Dashboard)
              </p>
            </div>
            <button
              onClick={onViewWebsite}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#E8D6C3] transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#C47B55]" />
              <span>Open Customer Storefront</span>
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#F8F0E5] text-[#3B211B] p-5 sm:p-8">
          {/* TAB 0: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
              <div>
                <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider">
                  Bakery Administration Suite
                </span>
                <h2 className="font-serif text-3xl font-bold text-[#3B211B] mt-1">
                  BrowineGirlCakes Storefront Control Center
                </h2>
                <p className="text-sm text-[#3B211B]/70 mt-1">
                  Configure your bakery photography, prices, class time slots, phone numbers, email, and social IDs. All adjustments save instantly to your live website.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#C47B55]">
                    <UtensilsCrossed className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#3B211B]">{menuItems.length} Brownies</p>
                  <p className="text-xs text-[#3B211B]/60">Menu items displayed on website</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#C47B55]">
                    <Calendar className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C47B55] bg-[#F8F0E5] px-2 py-0.5 rounded-full">
                      Online & Studio
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#3B211B]">{bakingClasses.length} Masterclasses</p>
                  <p className="text-xs text-[#3B211B]/60">Configured with live date schedules</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#C47B55]">
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Firestore DB
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#3B211B]">{allRegistrations.length} Bookings</p>
                  <p className="text-xs text-[#3B211B]/60">Student registrations recorded</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#C47B55]">
                    <Phone className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      Hotline
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[#3B211B] truncate">{settings.phone}</p>
                  <p className="text-xs text-[#3B211B]/60">Email: {settings.email}</p>
                </div>
              </div>

              {/* Quick Jump Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab('images')}
                  className="bg-white p-6 rounded-2xl border border-[#E8D6C3] shadow-xs hover:border-[#C47B55] transition-all cursor-pointer space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F8F0E5] group-hover:bg-[#C47B55] group-hover:text-white text-[#C47B55] flex items-center justify-center transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#3B211B]">
                    Change Images
                  </h3>
                  <p className="text-xs text-[#3B211B]/70">
                    Update high-res photographs for all 3 hero slides, close-up chocolate textures, and about section baker photos.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('menu')}
                  className="bg-white p-6 rounded-2xl border border-[#E8D6C3] shadow-xs hover:border-[#C47B55] transition-all cursor-pointer space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F8F0E5] group-hover:bg-[#C47B55] group-hover:text-white text-[#C47B55] flex items-center justify-center transition-colors">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#3B211B]">
                    Add Menu Items & Prices
                  </h3>
                  <p className="text-xs text-[#3B211B]/70">
                    Add new brownies, alter prices in real time, edit origin stories, descriptions, and cocoa percentages.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('classes')}
                  className="bg-white p-6 rounded-2xl border border-[#E8D6C3] shadow-xs hover:border-[#C47B55] transition-all cursor-pointer space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F8F0E5] group-hover:bg-[#C47B55] group-hover:text-white text-[#C47B55] flex items-center justify-center transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#3B211B]">
                    Online Class Times
                  </h3>
                  <p className="text-xs text-[#3B211B]/70">
                    Update scheduled class times, online workshop slots, student fees, durations, and curriculum details.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('admins')}
                  className="bg-white p-6 rounded-2xl border border-[#E8D6C3] shadow-xs hover:border-[#C47B55] transition-all cursor-pointer space-y-3 group md:col-span-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8F0E5] group-hover:bg-[#C47B55] group-hover:text-white text-[#C47B55] flex items-center justify-center transition-colors">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-[#3B211B]">
                          Admin Access & Team Management
                        </h3>
                        <p className="text-xs text-[#3B211B]/70">
                          {authorizedAdmins.length} authorized administrators &bull; Primary Owner: <strong>{OFFICIAL_OWNER_EMAIL}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#C47B55] group-hover:underline flex items-center gap-1">
                      Manage Team Access &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: CHANGE IMAGES */}
          {activeTab === 'images' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider">
                  Visual Assets & Local Storage
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                  Change Hero Carousel & Bakery Section Images
                </h3>
                <p className="text-xs text-[#3B211B]/70 mt-1">
                  Upload photos directly from your computer or phone local storage, paste an image URL, or pick from curated bakery presets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hero Slide 1 */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider block">
                      Hero Slide 1: The Baker Behind the Brand
                    </span>
                    <LocalImageUploader
                      label="Upload Local Photo"
                      onImageSelected={(dataUrl) => {
                        setImageForm((prev) => ({ ...prev, heroSlide1Image: dataUrl }));
                        triggerSuccess('Loaded local photo for Hero Slide 1! Remember to save changes.');
                      }}
                    />
                  </div>
                  <div className="h-48 w-full rounded-2xl overflow-hidden bg-black/10 border border-[#E8D6C3] relative group">
                    <img
                      src={imageForm.heroSlide1Image}
                      alt="Hero Slide 1"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_SETTINGS.heroSlide1Image;
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#3B211B] block mb-1">
                      Direct Photo URL or Local Upload Data:
                    </label>
                    <input
                      type="text"
                      value={imageForm.heroSlide1Image}
                      onChange={(e) => setImageForm({ ...imageForm, heroSlide1Image: e.target.value })}
                      placeholder="Paste URL or use Upload button above"
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-mono text-[#3B211B]"
                    />
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-[#3B211B]/60 font-semibold block mb-1">
                      Quick Preset Options:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {IMAGE_PRESETS.hero1.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageForm({ ...imageForm, heroSlide1Image: p.url })}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            imageForm.heroSlide1Image === p.url
                              ? 'bg-[#3B211B] text-[#E8D6C3] border-[#3B211B]'
                              : 'bg-[#F8F0E5] text-[#3B211B] border-[#E8D6C3] hover:bg-[#E8D6C3]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hero Slide 2 */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider block">
                      Hero Slide 2: The Chocolate Experience
                    </span>
                    <LocalImageUploader
                      label="Upload Local Photo"
                      onImageSelected={(dataUrl) => {
                        setImageForm((prev) => ({ ...prev, heroSlide2Image: dataUrl }));
                        triggerSuccess('Loaded local photo for Hero Slide 2! Remember to save changes.');
                      }}
                    />
                  </div>
                  <div className="h-48 w-full rounded-2xl overflow-hidden bg-black/10 border border-[#E8D6C3]">
                    <img
                      src={imageForm.heroSlide2Image}
                      alt="Hero Slide 2"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_SETTINGS.heroSlide2Image;
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#3B211B] block mb-1">
                      Direct Photo URL or Local Upload Data:
                    </label>
                    <input
                      type="text"
                      value={imageForm.heroSlide2Image}
                      onChange={(e) => setImageForm({ ...imageForm, heroSlide2Image: e.target.value })}
                      placeholder="Paste URL or use Upload button above"
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-mono text-[#3B211B]"
                    />
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-[#3B211B]/60 font-semibold block mb-1">
                      Quick Preset Options:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {IMAGE_PRESETS.hero2.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageForm({ ...imageForm, heroSlide2Image: p.url })}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            imageForm.heroSlide2Image === p.url
                              ? 'bg-[#3B211B] text-[#E8D6C3] border-[#3B211B]'
                              : 'bg-[#F8F0E5] text-[#3B211B] border-[#E8D6C3] hover:bg-[#E8D6C3]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hero Slide 3 */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider block">
                      Hero Slide 3: Baking Studio Workshop
                    </span>
                    <LocalImageUploader
                      label="Upload Local Photo"
                      onImageSelected={(dataUrl) => {
                        setImageForm((prev) => ({ ...prev, heroSlide3Image: dataUrl }));
                        triggerSuccess('Loaded local photo for Hero Slide 3! Remember to save changes.');
                      }}
                    />
                  </div>
                  <div className="h-48 w-full rounded-2xl overflow-hidden bg-black/10 border border-[#E8D6C3]">
                    <img
                      src={imageForm.heroSlide3Image}
                      alt="Hero Slide 3"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_SETTINGS.heroSlide3Image;
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#3B211B] block mb-1">
                      Direct Photo URL or Local Upload Data:
                    </label>
                    <input
                      type="text"
                      value={imageForm.heroSlide3Image}
                      onChange={(e) => setImageForm({ ...imageForm, heroSlide3Image: e.target.value })}
                      placeholder="Paste URL or use Upload button above"
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-mono text-[#3B211B]"
                    />
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-[#3B211B]/60 font-semibold block mb-1">
                      Quick Preset Options:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {IMAGE_PRESETS.hero3.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageForm({ ...imageForm, heroSlide3Image: p.url })}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            imageForm.heroSlide3Image === p.url
                              ? 'bg-[#3B211B] text-[#E8D6C3] border-[#3B211B]'
                              : 'bg-[#F8F0E5] text-[#3B211B] border-[#E8D6C3] hover:bg-[#E8D6C3]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* About Section Baker Photo */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider block">
                      Our Story: Artisan Baker Portrait
                    </span>
                    <LocalImageUploader
                      label="Upload Local Photo"
                      onImageSelected={(dataUrl) => {
                        setImageForm((prev) => ({ ...prev, aboutImage: dataUrl }));
                        triggerSuccess('Loaded local photo for Baker Story! Remember to save changes.');
                      }}
                    />
                  </div>
                  <div className="h-48 w-full rounded-2xl overflow-hidden bg-black/10 border border-[#E8D6C3]">
                    <img
                      src={imageForm.aboutImage}
                      alt="About Baker"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_SETTINGS.aboutImage;
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#3B211B] block mb-1">
                      Direct Photo URL or Local Upload Data:
                    </label>
                    <input
                      type="text"
                      value={imageForm.aboutImage}
                      onChange={(e) => setImageForm({ ...imageForm, aboutImage: e.target.value })}
                      placeholder="Paste URL or use Upload button above"
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-mono text-[#3B211B]"
                    />
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-[#3B211B]/60 font-semibold block mb-1">
                      Quick Preset Options:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {IMAGE_PRESETS.about.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageForm({ ...imageForm, aboutImage: p.url })}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            imageForm.aboutImage === p.url
                              ? 'bg-[#3B211B] text-[#E8D6C3] border-[#3B211B]'
                              : 'bg-[#F8F0E5] text-[#3B211B] border-[#E8D6C3] hover:bg-[#E8D6C3]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={async () => {
                    await updateSettings(imageForm);
                    triggerSuccess('Hero and section images updated live on the website!');
                  }}
                  className="px-6 py-3 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Image Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PHONE, EMAIL, INSTAGRAM, FACEBOOK */}
          {activeTab === 'contact' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider">
                  Contact & Socials
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                  Bakery Phone Numbers, Email & Social Media Handles
                </h3>
                <p className="text-xs text-[#3B211B]/70 mt-1">
                  Updates made here immediately propagate to the website top announcement bar, header, contact modals, and footer.
                </p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Display Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C47B55]" />
                      Display Phone Number
                    </label>
                    <input
                      type="text"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="(555) 392-CAKE"
                      className="w-full p-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    />
                    <p className="text-[11px] text-[#3B211B]/60 mt-1.5">Visible on customer header & footer</p>
                  </div>

                  {/* Click-to-call Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C47B55]" />
                      Click-to-Call Phone (Tel link)
                    </label>
                    <input
                      type="text"
                      value={contactForm.phoneRaw}
                      onChange={(e) => setContactForm({ ...contactForm, phoneRaw: e.target.value })}
                      placeholder="+15553922253"
                      className="w-full p-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    />
                    <p className="text-[11px] text-[#3B211B]/60 mt-1.5">Used for direct mobile dialer links</p>
                  </div>

                  {/* Bakery Email */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C47B55]" />
                      Bakery Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="preethipreethu712@gmail.com"
                      className="w-full p-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    />
                  </div>

                  {/* Instagram ID or Full URL */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#3B211B] flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-[#C47B55]" />
                        Instagram URL or Profile ID
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setContactForm({ ...contactForm, instagramId: OFFICIAL_INSTAGRAM_URL });
                          triggerSuccess('Applied official working Instagram profile URL!');
                        }}
                        className="text-[10px] text-[#C47B55] hover:underline font-bold cursor-pointer"
                        title="Click to paste the verified official Instagram URL"
                      >
                        Set Official URL
                      </button>
                    </div>
                    <input
                      type="text"
                      value={contactForm.instagramId}
                      onChange={(e) => setContactForm({ ...contactForm, instagramId: e.target.value })}
                      placeholder="e.g. https://www.instagram.com/browniegirlcakes?exln=dTU4eXBuMjNmYmJr"
                      className="w-full p-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-mono text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#3B211B]/70">
                      <span className="truncate">
                        Resolves to: <a href={getInstagramUrl(contactForm.instagramId)} target="_blank" rel="noopener noreferrer" className="text-[#C47B55] font-semibold underline truncate inline-block max-w-[240px] align-bottom">{getInstagramUrl(contactForm.instagramId)}</a>
                      </span>
                      <ExternalLink className="w-3 h-3 text-[#C47B55] shrink-0 ml-1" />
                    </div>
                  </div>

                  {/* WhatsApp Inquiry Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp Inquiry Phone Number
                    </label>
                    <input
                      type="text"
                      value={contactForm.whatsappNumber || '7339651529'}
                      onChange={(e) => setContactForm({ ...contactForm, whatsappNumber: e.target.value })}
                      placeholder="7339651529"
                      className="w-full p-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    />
                    <p className="text-[11px] text-[#3B211B]/60 mt-1.5">
                      Customer chats route directly to WhatsApp (+91 {contactForm.whatsappNumber || '7339651529'})
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F8F0E5] flex justify-end">
                  <button
                    onClick={async () => {
                      await updateSettings(contactForm);
                      triggerSuccess('Phone numbers, email, and social IDs saved and updated live on the website!');
                    }}
                    className="px-6 py-3 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Contact & Socials</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BROWNIE MENU & PRICES */}
          {activeTab === 'menu' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider">
                    Menu Management
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                    Brownie Menu Items & Pricing
                  </h3>
                  <p className="text-xs text-[#3B211B]/70 mt-1">
                    Add new creations, adjust prices, edit descriptions, and update photo links.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingBrownie(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3B211B] hover:bg-[#23120E] text-[#F8F0E5] text-xs font-bold transition-all shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-[#E5A962]" />
                  <span>+ Add New Brownie</span>
                </button>
              </div>

              {/* Add New Brownie Form */}
              {isAddingBrownie && (
                <div className="p-6 bg-white rounded-3xl border-2 border-[#C47B55] shadow-lg space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-lg font-bold text-[#3B211B] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C47B55]" />
                      Create New Brownie Square
                    </h4>
                    <button
                      onClick={() => setIsAddingBrownie(false)}
                      className="text-xs text-[#3B211B]/60 hover:text-black font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Brownie Name *</label>
                      <input
                        type="text"
                        value={newBrownie.name}
                        onChange={(e) => setNewBrownie({ ...newBrownie, name: e.target.value })}
                        placeholder="e.g. Cardamom Rose Fudge"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Origin / Subtitle</label>
                      <input
                        type="text"
                        value={newBrownie.subtitle}
                        onChange={(e) => setNewBrownie({ ...newBrownie, subtitle: e.target.value })}
                        placeholder="e.g. 74% Venezuelan Cacao"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Price *</label>
                      <input
                        type="text"
                        value={newBrownie.price}
                        onChange={(e) => setNewBrownie({ ...newBrownie, price: e.target.value })}
                        placeholder="₹199 / piece"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs font-bold text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Cocoa %</label>
                      <input
                        type="text"
                        value={newBrownie.cocoaPercentage}
                        onChange={(e) => setNewBrownie({ ...newBrownie, cocoaPercentage: e.target.value })}
                        placeholder="72% Dark"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Badge (Optional)</label>
                      <input
                        type="text"
                        value={newBrownie.badge || ''}
                        onChange={(e) => setNewBrownie({ ...newBrownie, badge: e.target.value })}
                        placeholder="Bestseller / New"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#3B211B]">Brownie Photo</label>
                        <LocalImageUploader
                          label="Upload Local"
                          className="py-1 px-2 text-[10px]"
                          onImageSelected={(dataUrl) => {
                            setNewBrownie((prev) => ({ ...prev, image: dataUrl }));
                            triggerSuccess('Loaded local photo for new brownie!');
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={newBrownie.image}
                        onChange={(e) => setNewBrownie({ ...newBrownie, image: e.target.value })}
                        placeholder="Paste image URL or use Upload Local"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newBrownie.description}
                        onChange={(e) => setNewBrownie({ ...newBrownie, description: e.target.value })}
                        placeholder="Rich description of chocolate textures, aroma, and tasting notes..."
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsAddingBrownie(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#3B211B] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!newBrownie.name.trim() || !newBrownie.price.trim()) {
                          alert('Please enter a brownie name and price.');
                          return;
                        }
                        await addMenuItem(newBrownie);
                        setIsAddingBrownie(false);
                        triggerSuccess(`Added "${newBrownie.name}" to menu!`);
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Save New Brownie
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Brownie List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((brownie) => {
                  const isExpanded = expandedBrownieId === brownie.id;

                  return (
                    <div
                      key={brownie.id}
                      className="bg-white p-5 rounded-3xl border border-[#E8D6C3] shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div className="flex gap-4">
                        <img
                          src={brownie.image}
                          alt={brownie.name}
                          className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-[#E8D6C3]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C47B55]">
                              {brownie.cocoaPercentage}
                            </span>
                            {brownie.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#3B211B] text-[#E8D6C3]">
                                {brownie.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-base text-[#3B211B] truncate mt-0.5">
                            {brownie.name}
                          </h4>
                          <p className="text-xs text-[#3B211B]/70 line-clamp-2 mt-1">
                            {brownie.description}
                          </p>
                        </div>
                      </div>

                      {/* Quick Price & Image Editor */}
                      <div className="pt-3 border-t border-[#F8F0E5] grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="text-[10px] font-bold text-[#3B211B] block">Change Price (₹)</label>
                          <input
                            type="text"
                            value={brownie.price}
                            onChange={(e) => updateMenuItem(brownie.id, { price: e.target.value })}
                            className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs font-bold text-[#3B211B]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-bold text-[#3B211B]">Photo URL / Upload</label>
                            <LocalImageUploader
                              label="Upload"
                              className="py-0.5 px-2 text-[9px]"
                              onImageSelected={(dataUrl) => {
                                updateMenuItem(brownie.id, { image: dataUrl });
                                triggerSuccess(`Updated photo for "${brownie.name}" from local device!`);
                              }}
                            />
                          </div>
                          <input
                            type="text"
                            value={brownie.image}
                            onChange={(e) => updateMenuItem(brownie.id, { image: e.target.value })}
                            placeholder="Image URL or local photo"
                            className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-[11px] font-mono text-[#3B211B] truncate"
                          />
                        </div>
                      </div>

                      {/* Expandable fields */}
                      {isExpanded && (
                        <div className="p-3 bg-[#F8F0E5]/50 rounded-xl space-y-2 border border-[#E8D6C3] animate-in fade-in">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-[#3B211B] block">Name</label>
                              <input
                                type="text"
                                value={brownie.name}
                                onChange={(e) => updateMenuItem(brownie.id, { name: e.target.value })}
                                className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#3B211B] block">Origin / Subtitle</label>
                              <input
                                type="text"
                                value={brownie.subtitle}
                                onChange={(e) => updateMenuItem(brownie.id, { subtitle: e.target.value })}
                                className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#3B211B] block">Cocoa %</label>
                              <input
                                type="text"
                                value={brownie.cocoaPercentage}
                                onChange={(e) => updateMenuItem(brownie.id, { cocoaPercentage: e.target.value })}
                                className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#3B211B] block">Badge</label>
                              <input
                                type="text"
                                value={brownie.badge || ''}
                                onChange={(e) => updateMenuItem(brownie.id, { badge: e.target.value })}
                                className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#3B211B] block">Description</label>
                            <textarea
                              rows={2}
                              value={brownie.description}
                              onChange={(e) => updateMenuItem(brownie.id, { description: e.target.value })}
                              className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-xs"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => setExpandedBrownieId(isExpanded ? null : brownie.id)}
                          className="text-xs text-[#C47B55] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Hide Extra Fields' : 'Edit Name & Details'}</span>
                        </button>

                        {deletingBrownieId === brownie.id ? (
                          <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-300 rounded-xl animate-in fade-in">
                            <span className="text-[10px] font-bold text-red-700 px-1">Delete item?</span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await deleteMenuItem(brownie.id);
                                setDeletingBrownieId(null);
                                triggerSuccess(`Deleted "${brownie.name}"`);
                              }}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingBrownieId(null);
                              }}
                              className="px-2 py-0.5 bg-white text-[#3B211B] rounded-md text-[10px] font-semibold cursor-pointer border border-[#E8D6C3]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeletingBrownieId(brownie.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs flex items-center gap-1 cursor-pointer font-semibold"
                            title="Delete brownie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BAKING CLASS SCHEDULE & TIMES */}
          {activeTab === 'classes' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider">
                    Studio & Online Masterclasses
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                    Manage Online Class Times & Batch Dates
                  </h3>
                  <p className="text-xs text-[#3B211B]/70 mt-1">
                    Update scheduled class batch times, online masterclasses, durations, skill levels, and booking fees.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingClass(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3B211B] hover:bg-[#23120E] text-[#F8F0E5] text-xs font-bold transition-all shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-[#E5A962]" />
                  <span>+ Add New Class</span>
                </button>
              </div>

              {/* Add Class Form */}
              {isAddingClass && (
                <div className="p-6 bg-white rounded-3xl border-2 border-[#C47B55] shadow-lg space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-lg font-bold text-[#3B211B] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#C47B55]" />
                      Create New Baking Masterclass
                    </h4>
                    <button
                      onClick={() => setIsAddingClass(false)}
                      className="text-xs text-[#3B211B]/60 hover:text-black font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Class Title *</label>
                      <input
                        type="text"
                        value={newClass.title}
                        onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                        placeholder="e.g. Live Online Holiday Ganache & Brownie Workshop"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Price / Fee *</label>
                      <input
                        type="text"
                        value={newClass.price}
                        onChange={(e) => setNewClass({ ...newClass, price: e.target.value })}
                        placeholder="₹1,999 / person"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs font-bold text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Duration</label>
                      <input
                        type="text"
                        value={newClass.duration}
                        onChange={(e) => setNewClass({ ...newClass, duration: e.target.value })}
                        placeholder="2.5 Hours"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Skill Level</label>
                      <input
                        type="text"
                        value={newClass.level}
                        onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}
                        placeholder="All Levels (Beginner to Advanced)"
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Format</label>
                      <input
                        type="text"
                        value="Live Online & In-Studio"
                        readOnly
                        className="w-full p-2.5 bg-[#F8F0E5]/30 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]/70"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-xs font-bold text-[#3B211B] block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newClass.description}
                        onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                        placeholder="Detailed curriculum, chocolate techniques, recipe takeaway..."
                        className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsAddingClass(false)}
                      className="px-4 py-2 text-xs font-semibold text-[#3B211B] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!newClass.title.trim()) {
                          alert('Please enter a class title.');
                          return;
                        }
                        await addClass(newClass);
                        setIsAddingClass(false);
                        triggerSuccess(`Added masterclass "${newClass.title}"!`);
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Save New Class
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Classes List */}
              <div className="space-y-4">
                {bakingClasses.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-[#E8D6C3] text-center space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-[#C47B55]/15 text-[#C47B55] mx-auto flex items-center justify-center shadow-inner">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#3B211B]">
                      Zero Baking Classes Configured
                    </h4>
                    <p className="text-xs text-[#3B211B]/60 max-w-md mx-auto leading-relaxed">
                      All classes are currently reset to zero. The storefront will automatically display waitlist registration for upcoming seasonal batches. You can click <strong>"+ Add New Class"</strong> above anytime you wish to create a workshop.
                    </p>
                  </div>
                ) : (
                  bakingClasses.map((cls) => {
                  const isExpanded = expandedClassId === cls.id;
                  const currentAddDate = classDateInputs[cls.id] || '';

                  return (
                    <div
                      key={cls.id}
                      className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C47B55] bg-[#F8F0E5] px-2.5 py-0.5 rounded-md">
                              {cls.level} &bull; {cls.duration}
                            </span>
                          </div>
                          <h4 className="font-serif text-lg font-bold text-[#3B211B] mt-1">
                            {cls.title}
                          </h4>
                          <p className="text-xs text-[#3B211B]/70 mt-1 line-clamp-2">
                            {cls.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-[#3B211B] block">Fee / Person</span>
                            <input
                              type="text"
                              value={cls.price}
                              onChange={(e) => updateClass(cls.id, { price: e.target.value })}
                              className="p-2 px-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-bold text-[#3B211B] w-28 text-right"
                            />
                          </div>
                          {deletingClassId === cls.id ? (
                            <div className="flex items-center gap-1.5 p-1.5 bg-red-50 border border-red-300 rounded-xl animate-in fade-in shadow-xs">
                              <span className="text-[11px] font-bold text-red-700 px-1">Delete class?</span>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  await deleteClass(cls.id);
                                  setDeletingClassId(null);
                                  triggerSuccess(`Permanently deleted class "${cls.title}"`);
                                }}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Yes, Delete
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeletingClassId(null);
                                }}
                                className="px-2 py-1 bg-white hover:bg-stone-100 text-[#3B211B] rounded-lg text-[11px] font-semibold cursor-pointer border border-[#E8D6C3] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingClassId(cls.id);
                              }}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                              title="Delete masterclass"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scheduled Class Times & Dates */}
                      <div className="p-4 sm:p-5 bg-[#F8F0E5]/50 rounded-2xl border border-[#E8D6C3] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#3B211B] uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#C47B55]" />
                            Scheduled Class Times ({(cls.dates || []).length} Available Slots):
                          </span>
                        </div>

                        <div className="space-y-2">
                          {(cls.dates || []).map((dateStr, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={dateStr}
                                onChange={(e) => {
                                  const newDates = [...(cls.dates || [])];
                                  newDates[dIdx] = e.target.value;
                                  updateClass(cls.id, { dates: newDates });
                                }}
                                className="flex-1 p-2.5 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] font-medium"
                              />
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const newDates = (cls.dates || []).filter((_, idx) => idx !== dIdx);
                                  await updateClass(cls.id, { dates: newDates });
                                  triggerSuccess('Removed scheduled class time slot');
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg text-xs cursor-pointer transition-colors"
                                title="Remove scheduled class time slot"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add new date slot for this class */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="e.g. Every Thursday @ 7:00 PM (Live Online) or Saturday @ 2:00 PM"
                            value={currentAddDate}
                            onChange={(e) =>
                              setClassDateInputs({ ...classDateInputs, [cls.id]: e.target.value })
                            }
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!currentAddDate.trim()) return;
                                const newDates = [...(cls.dates || []), currentAddDate.trim()];
                                await updateClass(cls.id, { dates: newDates });
                                setClassDateInputs({ ...classDateInputs, [cls.id]: '' });
                                triggerSuccess('Added new class session time!');
                              }
                            }}
                            className="flex-1 p-2.5 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                          />
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!currentAddDate.trim()) return;
                              const newDates = [...(cls.dates || []), currentAddDate.trim()];
                              await updateClass(cls.id, { dates: newDates });
                              setClassDateInputs({ ...classDateInputs, [cls.id]: '' });
                              triggerSuccess('Added new class session time!');
                            }}
                            className="px-4 py-2.5 bg-[#C47B55] hover:bg-[#D98B5F] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            + Add Time Slot
                          </button>
                        </div>
                      </div>

                      {/* Expandable Class Details */}
                      {isExpanded && (
                        <div className="p-4 bg-white rounded-2xl border border-[#E8D6C3] space-y-3 animate-in fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-[#3B211B] block">Title</label>
                              <input
                                type="text"
                                value={cls.title}
                                onChange={(e) => updateClass(cls.id, { title: e.target.value })}
                                className="w-full p-2 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-lg text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#3B211B] block">Duration</label>
                              <input
                                type="text"
                                value={cls.duration}
                                onChange={(e) => updateClass(cls.id, { duration: e.target.value })}
                                className="w-full p-2 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-lg text-xs"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="text-[10px] font-bold text-[#3B211B] block">Description</label>
                              <textarea
                                rows={2}
                                value={cls.description}
                                onChange={(e) => updateClass(cls.id, { description: e.target.value })}
                                className="w-full p-2 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                          className="text-xs text-[#C47B55] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Hide Extra Fields' : 'Edit Class Title & Description'}</span>
                        </button>
                        <span className="text-[11px] text-green-700 font-semibold">
                          ✓ Auto-saved on change
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          )}

          {/* TAB 5: ACHIEVEMENTS & MILESTONES */}
          {activeTab === 'achievements' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider">
                  Accolades & Milestones
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                  Edit Achievements & Milestones Section
                </h3>
                <p className="text-xs text-[#3B211B]/70 mt-1">
                  Update statistics, baking class graduate counters, review ratings, and industry certifications.
                </p>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stat 1 */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-2">
                  <span className="text-[11px] font-bold text-[#C47B55] uppercase">Statistic #1</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Number / Stat</label>
                      <input
                        type="text"
                        value={achForm.stat1Value}
                        onChange={(e) => setAchForm({ ...achForm, stat1Value: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-bold text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Label</label>
                      <input
                        type="text"
                        value={achForm.stat1Label}
                        onChange={(e) => setAchForm({ ...achForm, stat1Label: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#3B211B] block">Description</label>
                    <input
                      type="text"
                      value={achForm.stat1Desc}
                      onChange={(e) => setAchForm({ ...achForm, stat1Desc: e.target.value })}
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                    />
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-2">
                  <span className="text-[11px] font-bold text-[#C47B55] uppercase">Statistic #2</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Number / Stat</label>
                      <input
                        type="text"
                        value={achForm.stat2Value}
                        onChange={(e) => setAchForm({ ...achForm, stat2Value: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-bold text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Label</label>
                      <input
                        type="text"
                        value={achForm.stat2Label}
                        onChange={(e) => setAchForm({ ...achForm, stat2Label: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#3B211B] block">Description</label>
                    <input
                      type="text"
                      value={achForm.stat2Desc}
                      onChange={(e) => setAchForm({ ...achForm, stat2Desc: e.target.value })}
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                    />
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-2">
                  <span className="text-[11px] font-bold text-[#C47B55] uppercase">Statistic #3</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Number / Stat</label>
                      <input
                        type="text"
                        value={achForm.stat3Value}
                        onChange={(e) => setAchForm({ ...achForm, stat3Value: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-bold text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Label</label>
                      <input
                        type="text"
                        value={achForm.stat3Label}
                        onChange={(e) => setAchForm({ ...achForm, stat3Label: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#3B211B] block">Description</label>
                    <input
                      type="text"
                      value={achForm.stat3Desc}
                      onChange={(e) => setAchForm({ ...achForm, stat3Desc: e.target.value })}
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                    />
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-white p-6 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-2">
                  <span className="text-[11px] font-bold text-[#C47B55] uppercase">Statistic #4</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Number / Stat</label>
                      <input
                        type="text"
                        value={achForm.stat4Value}
                        onChange={(e) => setAchForm({ ...achForm, stat4Value: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-bold text-[#3B211B]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#3B211B] block">Label</label>
                      <input
                        type="text"
                        value={achForm.stat4Label}
                        onChange={(e) => setAchForm({ ...achForm, stat4Label: e.target.value })}
                        className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#3B211B] block">Description</label>
                    <input
                      type="text"
                      value={achForm.stat4Desc}
                      onChange={(e) => setAchForm({ ...achForm, stat4Desc: e.target.value })}
                      className="w-full p-2.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                    />
                  </div>
                </div>
              </div>

              {/* Awards and Honors */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B211B] block">
                  Industry Awards & Accreditations (3 Cards)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Award 1 */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] space-y-2">
                    <label className="text-[10px] font-bold text-[#3B211B] block">Award 1 Title</label>
                    <input
                      type="text"
                      value={achForm.award1Title}
                      onChange={(e) => setAchForm({ ...achForm, award1Title: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs font-bold text-[#3B211B]"
                    />
                    <label className="text-[10px] font-bold text-[#3B211B] block">Organization</label>
                    <input
                      type="text"
                      value={achForm.award1Org}
                      onChange={(e) => setAchForm({ ...achForm, award1Org: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs text-[#3B211B]"
                    />
                    <label className="text-[10px] font-bold text-[#3B211B] block">Highlight Note</label>
                    <input
                      type="text"
                      value={achForm.award1Note}
                      onChange={(e) => setAchForm({ ...achForm, award1Note: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs text-[#3B211B]"
                    />
                  </div>

                  {/* Award 2 */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] space-y-2">
                    <label className="text-[10px] font-bold text-[#3B211B] block">Award 2 Title</label>
                    <input
                      type="text"
                      value={achForm.award2Title}
                      onChange={(e) => setAchForm({ ...achForm, award2Title: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs font-bold text-[#3B211B]"
                    />
                    <label className="text-[10px] font-bold text-[#3B211B] block">Organization</label>
                    <input
                      type="text"
                      value={achForm.award2Org}
                      onChange={(e) => setAchForm({ ...achForm, award2Org: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs text-[#3B211B]"
                    />
                    <label className="text-[10px] font-bold text-[#3B211B] block">Highlight Note</label>
                    <input
                      type="text"
                      value={achForm.award2Note}
                      onChange={(e) => setAchForm({ ...achForm, award2Note: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs text-[#3B211B]"
                    />
                  </div>

                  {/* Award 3 */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] space-y-2">
                    <label className="text-[10px] font-bold text-[#3B211B] block">Award 3 Title</label>
                    <input
                      type="text"
                      value={achForm.award3Title}
                      onChange={(e) => setAchForm({ ...achForm, award3Title: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs font-bold text-[#3B211B]"
                    />
                    <label className="text-[10px] font-bold text-[#3B211B] block">Organization</label>
                    <input
                      type="text"
                      value={achForm.award3Org}
                      onChange={(e) => setAchForm({ ...achForm, award3Org: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs text-[#3B211B]"
                    />
                    <label className="text-[10px] font-bold text-[#3B211B] block">Highlight Note</label>
                    <input
                      type="text"
                      value={achForm.award3Note}
                      onChange={(e) => setAchForm({ ...achForm, award3Note: e.target.value })}
                      className="w-full p-2 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-lg text-xs text-[#3B211B]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={async () => {
                    await updateAchievements(achForm);
                    triggerSuccess('Achievements & Awards updated live on the website!');
                  }}
                  className="px-6 py-3 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Achievements Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMER BOOKINGS & CUSTOMER ORDERS */}
          {activeTab === 'bookings' && (() => {
            // Helper to get class price estimate
            const getPriceNum = (classNameStr: string) => {
              const match = bakingClasses.find(
                (c) =>
                  c.title.toLowerCase().includes((classNameStr || '').toLowerCase()) ||
                  (classNameStr || '').toLowerCase().includes(c.title.toLowerCase())
              );
              if (match) {
                const parsed = parseInt(match.price.replace(/[^0-9]/g, ''), 10);
                return isNaN(parsed) ? 1999 : parsed;
              }
              return 1999;
            };

            // Map and group bookings by month
            const monthMap: Record<string, { info: MonthInfo; bookings: any[] }> = {};

            // Ensure current month and next 2 upcoming months are always represented for early assessment
            const now = new Date();
            for (let offset = 0; offset <= 2; offset++) {
              const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
              const mIdx = d.getMonth();
              const yr = d.getFullYear();
              const mKey = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;
              monthMap[mKey] = {
                info: {
                  key: mKey,
                  label: `${MONTH_NAMES[mIdx]} ${yr}`,
                  shortLabel: `${MONTH_NAMES[mIdx].slice(0, 3)} ${yr}`,
                  year: yr,
                  monthIndex: mIdx,
                },
                bookings: [],
              };
            }

            // Populate with actual registrations
            allRegistrations.forEach((reg) => {
              const mInfo = parseBookingMonth(reg.preferredDate, reg.createdAt);
              if (!monthMap[mInfo.key]) {
                monthMap[mInfo.key] = { info: mInfo, bookings: [] };
              }
              monthMap[mInfo.key].bookings.push(reg);
            });

            // Sort months chronologically
            const sortedMonthEntries = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));

            // Filter bookings by selected month
            let filteredRegistrations =
              selectedBookingMonth === 'all'
                ? allRegistrations
                : (monthMap[selectedBookingMonth]?.bookings || []);

            // Apply search
            if (bookingSearch.trim()) {
              const q = bookingSearch.toLowerCase();
              filteredRegistrations = filteredRegistrations.filter(
                (r) =>
                  (r.userName || '').toLowerCase().includes(q) ||
                  (r.userEmail || '').toLowerCase().includes(q) ||
                  (r.className || '').toLowerCase().includes(q) ||
                  (r.notes || '').toLowerCase().includes(q)
              );
            }

            // Apply status filter
            if (bookingStatusFilter !== 'all') {
              filteredRegistrations = filteredRegistrations.filter(
                (r) => (r.status || 'registered') === bookingStatusFilter
              );
            }

            // Calculate assessment metrics for currently viewed month or all
            const assessedRegistrations =
              selectedBookingMonth === 'all'
                ? allRegistrations
                : (monthMap[selectedBookingMonth]?.bookings || []);
            const regCount = assessedRegistrations.filter((r) => (r.status || 'registered') === 'registered').length;
            const waitCount = assessedRegistrations.filter((r) => r.status === 'waitlist').length;
            const cancelCount = assessedRegistrations.filter((r) => r.status === 'cancelled').length;
            const projectedRevenue = assessedRegistrations
              .filter((r) => (r.status || 'registered') === 'registered')
              .reduce((sum, r) => sum + getPriceNum(r.className), 0);

            let demandBadge = '⚪ Schedule Open';
            let demandColor = 'bg-stone-100 text-stone-700 border-stone-200';
            let adviceMessage = 'No reservations yet recorded for this scheduled period.';

            if (regCount >= 6) {
              demandBadge = '🔥 High Demand / Near Capacity';
              demandColor = 'bg-amber-100 text-amber-900 border-amber-300';
              adviceMessage =
                'Early Assessment: High interest! This masterclass batch is nearly full. Consider opening an additional weekend session.';
            } else if (regCount >= 3) {
              demandBadge = '🟢 Healthy Booking Pace';
              demandColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
              adviceMessage =
                'Early Assessment: Steady enrollments. Minimum class threshold reached, ready to run smoothly.';
            } else if (regCount >= 1) {
              demandBadge = '🟡 Early Alert: Under-Booked';
              demandColor = 'bg-yellow-100 text-yellow-900 border-yellow-300';
              adviceMessage =
                'Early Assessment: Under 3 students registered. Early notice recommends promoting this batch on Instagram Stories or sending an email blast.';
            }

            // Filter Customer Orders (Inquiries)
            let filteredInquiries = [...allInquiries];
            if (inquiryFilter === 'unread') {
              filteredInquiries = filteredInquiries.filter(
                (i) => i.status !== 'read' && !i.isRead && i.status !== 'replied' && i.status !== 'closed'
              );
            } else if (inquiryFilter === 'read') {
              filteredInquiries = filteredInquiries.filter(
                (i) => i.status === 'read' || i.isRead === true
              );
            } else if (inquiryFilter === 'replied') {
              filteredInquiries = filteredInquiries.filter(
                (i) => i.status === 'replied' || i.status === 'closed'
              );
            }

            if (inquirySearch.trim()) {
              const q = inquirySearch.toLowerCase();
              filteredInquiries = filteredInquiries.filter(
                (i) =>
                  (i.userName || '').toLowerCase().includes(q) ||
                  (i.userEmail || '').toLowerCase().includes(q) ||
                  (i.userPhone || '').toLowerCase().includes(q) ||
                  (i.subject || '').toLowerCase().includes(q) ||
                  (i.message || '').toLowerCase().includes(q)
              );
            }

            const unreadInquiriesCount = allInquiries.filter(
              (i) => i.status !== 'read' && !i.isRead && i.status !== 'replied' && i.status !== 'closed'
            ).length;

            return (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-16">
                {/* Header with Sub-Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3B211B]/40 pb-5">
                  <div>
                    <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-[#C47B55]" />
                      Live Storefront Records & Early Demand Intelligence
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                      Customer Bookings & Custom Orders
                    </h3>
                    <p className="text-xs text-[#3B211B]/70 mt-1">
                      Assess workshop bookings month-by-month for early capacity planning, manage registered students, and review/delete customer inquiries.
                    </p>
                  </div>

                  {/* Top Switcher */}
                  <div className="inline-flex p-1 bg-[#E8D6C3]/60 rounded-2xl border border-[#E8D6C3] self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setBookingsSubTab('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bookingsSubTab === 'all'
                          ? 'bg-[#3B211B] text-white shadow-xs'
                          : 'text-[#3B211B]/70 hover:text-[#3B211B]'
                      }`}
                    >
                      All Records ({allRegistrations.length + allInquiries.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingsSubTab('bookings')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        bookingsSubTab === 'bookings'
                          ? 'bg-[#3B211B] text-white shadow-xs'
                          : 'text-[#3B211B]/70 hover:text-[#3B211B]'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5 text-[#C47B55]" />
                      <span>Class Bookings ({allRegistrations.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingsSubTab('inquiries')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        bookingsSubTab === 'inquiries'
                          ? 'bg-[#3B211B] text-white shadow-xs'
                          : 'text-[#3B211B]/70 hover:text-[#3B211B]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#C47B55]" />
                      <span>Customer Orders ({allInquiries.length})</span>
                      {unreadInquiriesCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* SECTION 1: MASTERCLASS BOOKINGS & MONTHLY EARLY ASSESSMENT      */}
                {/* ============================================================== */}
                {(bookingsSubTab === 'all' || bookingsSubTab === 'bookings') && (
                  <div className="space-y-6 bg-[#F8F0E5]/60 p-5 sm:p-7 rounded-3xl border border-[#E8D6C3] shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C47B55] flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Early Assessment Module
                        </span>
                        <h4 className="font-serif text-xl font-bold text-[#3B211B] flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#C47B55]" />
                          Monthly-Wise Customer Bookings
                        </h4>
                        <p className="text-xs text-[#3B211B]/70 mt-0.5">
                          Evaluate enrollment density per month early so you can adjust baking supplies, schedule extra sessions, or promote under-booked batches in advance.
                        </p>
                      </div>

                      {/* View Mode Toggle */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="inline-flex p-1 bg-white rounded-xl border border-[#E8D6C3] shadow-2xs text-xs">
                          <button
                            type="button"
                            onClick={() => setBookingViewMode('monthly_assess')}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                              bookingViewMode === 'monthly_assess'
                                ? 'bg-[#C47B55] text-white'
                                : 'text-[#3B211B]/70 hover:text-[#3B211B]'
                            }`}
                          >
                            Monthly Assess View
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingViewMode('list')}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                              bookingViewMode === 'list'
                                ? 'bg-[#C47B55] text-white'
                                : 'text-[#3B211B]/70 hover:text-[#3B211B]'
                            }`}
                          >
                            All Bookings List
                          </button>
                        </div>

                        {/* Test simulation button */}
                        <button
                          type="button"
                          onClick={() => handleAddSampleBooking('November', 2026)}
                          className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-[#C47B55]/40 text-[#C47B55] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          title="Simulate a test student booking for November to preview early assessment"
                        >
                          + Simulate Nov Booking
                        </button>
                      </div>
                    </div>

                    {/* Month Filter Selector Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingMonth('all')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                          selectedBookingMonth === 'all'
                            ? 'bg-[#3B211B] text-white border-[#3B211B] shadow-xs'
                            : 'bg-white text-[#3B211B]/80 border-[#E8D6C3] hover:border-[#C47B55]'
                        }`}
                      >
                        All Months ({allRegistrations.length})
                      </button>

                      {sortedMonthEntries.map(([mKey, mData]) => {
                        const isSelected = selectedBookingMonth === mKey;
                        const count = mData.bookings.length;
                        return (
                          <button
                            key={mKey}
                            type="button"
                            onClick={() => setSelectedBookingMonth(mKey)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#C47B55] text-white border-[#C47B55] shadow-xs'
                                : 'bg-white text-[#3B211B]/80 border-[#E8D6C3] hover:border-[#C47B55]'
                            }`}
                          >
                            <span>{mData.info.label}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                isSelected ? 'bg-white/25 text-white' : 'bg-[#E8D6C3]/60 text-[#3B211B]'
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Early Assessment Intelligence KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Metric 1: Confirmed Seats */}
                      <div className="bg-white p-4 rounded-2xl border border-[#E8D6C3] shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B211B]/60">
                          Confirmed Student Seats
                        </span>
                        <div className="flex items-baseline justify-between">
                          <p className="font-serif text-2xl font-bold text-[#3B211B]">{regCount}</p>
                          <span className="text-[11px] text-[#3B211B]/60 font-mono">
                            {selectedBookingMonth === 'all' ? 'Across all months' : 'This Month'}
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-[#C47B55] h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (regCount / 10) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Metric 2: Waitlisted & Cancelled */}
                      <div className="bg-white p-4 rounded-2xl border border-[#E8D6C3] shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B211B]/60">
                          Waitlist & Cancellations
                        </span>
                        <div className="flex items-baseline justify-between">
                          <p className="font-serif text-2xl font-bold text-[#3B211B]">
                            {waitCount} <span className="text-xs font-normal text-amber-700">Waitlist</span>
                          </p>
                          <span className="text-xs text-red-600 font-semibold">{cancelCount} Cancelled</span>
                        </div>
                        <p className="text-[11px] text-[#3B211B]/60 mt-1">
                          {waitCount > 0 ? 'Excess demand present for this schedule' : 'No pending overflow'}
                        </p>
                      </div>

                      {/* Metric 3: Estimated Revenue */}
                      <div className="bg-white p-4 rounded-2xl border border-[#E8D6C3] shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B211B]/60">
                          Projected Class Revenue
                        </span>
                        <div className="flex items-baseline justify-between">
                          <p className="font-serif text-2xl font-bold text-[#2E7D32]">
                            {formatRupee(projectedRevenue)}
                          </p>
                          <span className="text-[10px] font-mono text-[#3B211B]/60">Est. Fee</span>
                        </div>
                        <p className="text-[11px] text-[#3B211B]/60 mt-1">
                          Calculated from confirmed workshop enrollments
                        </p>
                      </div>

                      {/* Metric 4: Early Demand Status */}
                      <div className="bg-white p-4 rounded-2xl border border-[#E8D6C3] shadow-2xs flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B211B]/60 block mb-1">
                            Early Demand Assessment
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${demandColor}`}
                          >
                            {demandBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#3B211B]/75 leading-tight mt-2 line-clamp-2">
                          {adviceMessage}
                        </p>
                      </div>
                    </div>

                    {/* Early Assessment Strategic Recommendation Banner */}
                    <div className="p-4 rounded-2xl bg-[#E5A962]/15 border border-[#E5A962]/40 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#C47B55] shrink-0 mt-0.5" />
                      <div className="text-xs text-[#3B211B] space-y-0.5">
                        <strong className="font-bold text-[#3B211B]">
                          Baker Early Assessment Advisory for{' '}
                          {selectedBookingMonth === 'all'
                            ? 'All Upcoming Months'
                            : monthMap[selectedBookingMonth]?.info.label || 'Selected Month'}
                          :
                        </strong>
                        <p className="text-[#3B211B]/80 leading-relaxed">
                          {adviceMessage} Keep class ratios to 6-8 students maximum per batch for the best hands-on fudge texture coaching.
                        </p>
                      </div>
                    </div>

                    {/* Search & Status Filter Bar for Bookings */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-[#3B211B]/40 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={bookingSearch}
                          onChange={(e) => setBookingSearch(e.target.value)}
                          placeholder="Search student name, email, or class title..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] placeholder-[#3B211B]/40 focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#3B211B]/70 flex items-center gap-1">
                          <Filter className="w-3.5 h-3.5" /> Filter:
                        </span>
                        <select
                          value={bookingStatusFilter}
                          onChange={(e) => setBookingStatusFilter(e.target.value as any)}
                          className="p-2 bg-white border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B] focus:outline-none"
                        >
                          <option value="all">All Statuses</option>
                          <option value="registered">Confirmed Registered</option>
                          <option value="waitlist">Waitlisted</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* MONTHLY GROUPED VIEW */}
                    {bookingViewMode === 'monthly_assess' && (
                      <div className="space-y-5">
                        {sortedMonthEntries
                          .filter(
                            ([mKey]) => selectedBookingMonth === 'all' || selectedBookingMonth === mKey
                          )
                          .map(([mKey, mData]) => {
                            const monthBookings = mData.bookings.filter((b) => {
                              if (bookingStatusFilter !== 'all' && (b.status || 'registered') !== bookingStatusFilter)
                                return false;
                              if (bookingSearch.trim()) {
                                const q = bookingSearch.toLowerCase();
                                return (
                                  (b.userName || '').toLowerCase().includes(q) ||
                                  (b.userEmail || '').toLowerCase().includes(q) ||
                                  (b.className || '').toLowerCase().includes(q)
                                );
                              }
                              return true;
                            });

                            return (
                              <div
                                key={mKey}
                                className="bg-white rounded-2xl border border-[#E8D6C3] overflow-hidden shadow-2xs"
                              >
                                {/* Month Header Bar */}
                                <div className="bg-[#3B211B] text-[#F8F0E5] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <CalendarDays className="w-4 h-4 text-[#E5A962]" />
                                    <h5 className="font-serif text-base font-bold text-[#F8F0E5]">
                                      {mData.info.label} Schedule
                                    </h5>
                                    <span className="px-2 py-0.5 rounded-full bg-white/15 text-[#E8D6C3] text-[10px] font-mono">
                                      {monthBookings.length} bookings
                                    </span>
                                  </div>
                                  <div className="text-xs text-[#E8D6C3]/80 flex items-center gap-3">
                                    <span>
                                      Confirmed:{' '}
                                      <strong className="text-white">
                                        {monthBookings.filter((b) => (b.status || 'registered') === 'registered').length}
                                      </strong>
                                    </span>
                                    <span>&bull;</span>
                                    <span>
                                      Est. Rev:{' '}
                                      <strong className="text-[#E5A962]">
                                        {formatRupee(
                                          monthBookings
                                            .filter((b) => (b.status || 'registered') === 'registered')
                                            .reduce((acc, b) => acc + getPriceNum(b.className), 0)
                                        )}
                                      </strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Bookings inside Month */}
                                <div className="p-4 space-y-3">
                                  {monthBookings.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-[#3B211B]/60">
                                      No student registrations recorded for {mData.info.label} yet.
                                    </div>
                                  ) : (
                                    monthBookings.map((reg) => (
                                      <div
                                        key={reg.id}
                                        className="p-4 rounded-xl bg-[#F8F0E5]/50 border border-[#E8D6C3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F0E5] transition-colors"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-[#3B211B]">
                                              {reg.className}
                                            </span>
                                            <span className="text-[11px] font-mono px-2 py-0.2 rounded-md bg-[#C47B55]/15 text-[#C47B55] font-semibold">
                                              {reg.preferredDate}
                                            </span>
                                          </div>
                                          <p className="text-xs text-[#3B211B]/80">
                                            Student: <strong>{reg.userName}</strong> &bull;{' '}
                                            <a
                                              href={`mailto:${reg.userEmail}`}
                                              className="text-[#C47B55] hover:underline"
                                            >
                                              {reg.userEmail}
                                            </a>
                                          </p>
                                          {reg.notes && (
                                            <p className="text-[11px] text-[#3B211B]/70 italic bg-white p-2 rounded-lg border border-[#E8D6C3]/60">
                                              Note: {reg.notes}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <select
                                            value={reg.status || 'registered'}
                                            onChange={async (e) => {
                                              try {
                                                await updateDoc(doc(db, 'class_registrations', reg.id), {
                                                  status: e.target.value,
                                                });
                                                setAllRegistrations((prev) =>
                                                  prev.map((item) =>
                                                    item.id === reg.id ? { ...item, status: e.target.value } : item
                                                  )
                                                );
                                                triggerSuccess(`Updated status to ${e.target.value}`);
                                              } catch (err) {
                                                console.warn(err);
                                              }
                                            }}
                                            className="p-1.5 px-2 bg-white border border-[#E8D6C3] rounded-lg text-xs font-semibold text-[#3B211B]"
                                          >
                                            <option value="registered">registered</option>
                                            <option value="waitlist">waitlist</option>
                                            <option value="cancelled">cancelled</option>
                                          </select>

                                          {/* Delete Booking Facility */}
                                          {deletingRegistrationId === reg.id ? (
                                            <div className="flex items-center gap-1 p-1 bg-red-50 border border-red-300 rounded-lg animate-in fade-in">
                                              <span className="text-[10px] font-bold text-red-700 px-1">
                                                Delete?
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteRegistration(reg.id, reg.userName)}
                                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                              >
                                                Yes
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setDeletingRegistrationId(null)}
                                                className="px-1.5 py-0.5 bg-white text-[#3B211B] rounded text-[10px] border border-[#E8D6C3] cursor-pointer"
                                              >
                                                No
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => setDeletingRegistrationId(reg.id)}
                                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                              title="Delete booking record"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* FLAT LIST VIEW */}
                    {bookingViewMode === 'list' && (
                      <div className="space-y-3">
                        {filteredRegistrations.length === 0 ? (
                          <div className="p-8 bg-white rounded-3xl text-center text-xs text-[#3B211B]/60 border border-[#E8D6C3]">
                            No class registrations match your search filters.
                          </div>
                        ) : (
                          filteredRegistrations.map((reg) => (
                            <div
                              key={reg.id}
                              className="bg-white p-5 rounded-2xl border border-[#E8D6C3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#3B211B]">{reg.className}</span>
                                  <span className="text-xs text-[#C47B55] font-semibold">
                                    &bull; {reg.preferredDate}
                                  </span>
                                </div>
                                <p className="text-xs text-[#3B211B]/80">
                                  Customer: <strong>{reg.userName}</strong> ({reg.userEmail})
                                </p>
                                {reg.notes && (
                                  <p className="text-xs text-[#3B211B]/60 italic">Notes: {reg.notes}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <select
                                  value={reg.status || 'registered'}
                                  onChange={async (e) => {
                                    try {
                                      await updateDoc(doc(db, 'class_registrations', reg.id), {
                                        status: e.target.value,
                                      });
                                      setAllRegistrations((prev) =>
                                        prev.map((item) =>
                                          item.id === reg.id ? { ...item, status: e.target.value } : item
                                        )
                                      );
                                      triggerSuccess(`Updated booking status to ${e.target.value}`);
                                    } catch (err) {
                                      console.warn(err);
                                    }
                                  }}
                                  className="p-2 bg-[#F8F0E5] border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B]"
                                >
                                  <option value="registered">registered</option>
                                  <option value="waitlist">waitlist</option>
                                  <option value="cancelled">cancelled</option>
                                </select>

                                {/* Delete Facility */}
                                {deletingRegistrationId === reg.id ? (
                                  <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-300 rounded-xl animate-in fade-in">
                                    <span className="text-[11px] font-bold text-red-700 px-1">Delete?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRegistration(reg.id, reg.userName)}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingRegistrationId(null)}
                                      className="px-2 py-1 bg-white text-[#3B211B] rounded-lg text-[10px] border border-[#E8D6C3] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingRegistrationId(reg.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                                    title="Delete booking"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================== */}
                {/* SECTION 2: CUSTOM ORDER INQUIRIES (DELETE & MARK AS READ)      */}
                {/* ============================================================== */}
                {(bookingsSubTab === 'all' || bookingsSubTab === 'inquiries') && (
                  <div className="space-y-5 bg-[#F8F0E5]/60 p-5 sm:p-7 rounded-3xl border border-[#E8D6C3] shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C47B55] flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Custom Orders Management
                        </span>
                        <h4 className="font-serif text-xl font-bold text-[#3B211B]">
                          Customer Orders & Bespoke Inquiries ({allInquiries.length})
                        </h4>
                        <p className="text-xs text-[#3B211B]/70 mt-0.5">
                          Manage custom orders, review requested brownie flavors, mark items as read or replied, chat with customers on WhatsApp, and permanently delete fulfilled/test records.
                        </p>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {unreadInquiriesCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllInquiriesAsRead}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-[#C47B55] text-[#C47B55] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark All Read ({unreadInquiriesCount})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleAddSampleInquiry}
                          className="px-3 py-1.5 bg-[#3B211B] hover:bg-[#23120E] text-[#F8F0E5] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          + Simulate Order
                        </button>
                      </div>
                    </div>

                    {/* Filter Tabs & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                      {/* Status Tabs */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          type="button"
                          onClick={() => setInquiryFilter('all')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            inquiryFilter === 'all'
                              ? 'bg-[#3B211B] text-white border-[#3B211B]'
                              : 'bg-white text-[#3B211B]/70 border-[#E8D6C3] hover:border-[#C47B55]'
                          }`}
                        >
                          All Orders ({allInquiries.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setInquiryFilter('unread')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                            inquiryFilter === 'unread'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-[#3B211B]/70 border-[#E8D6C3] hover:border-amber-400'
                          }`}
                        >
                          {unreadInquiriesCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          <span>Unread ({unreadInquiriesCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInquiryFilter('read')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            inquiryFilter === 'read'
                              ? 'bg-[#C47B55] text-white border-[#C47B55]'
                              : 'bg-white text-[#3B211B]/70 border-[#E8D6C3] hover:border-[#C47B55]'
                          }`}
                        >
                          Read ({allInquiries.filter((i) => i.status === 'read' || i.isRead).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setInquiryFilter('replied')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            inquiryFilter === 'replied'
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-[#3B211B]/70 border-[#E8D6C3] hover:border-blue-400'
                          }`}
                        >
                          Replied / Closed
                        </button>
                      </div>

                      {/* Search */}
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-[#3B211B]/40 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={inquirySearch}
                          onChange={(e) => setInquirySearch(e.target.value)}
                          placeholder="Search order subject, customer, or phone..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] placeholder-[#3B211B]/40 focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                        />
                      </div>
                    </div>

                    {/* Customer Order Cards List */}
                    {filteredInquiries.length === 0 ? (
                      <div className="p-10 bg-white rounded-3xl text-center text-xs text-[#3B211B]/60 border border-[#E8D6C3] space-y-2">
                        <MessageSquare className="w-8 h-8 text-[#C47B55]/40 mx-auto" />
                        <p className="font-semibold text-sm text-[#3B211B]">No Customer Orders Found</p>
                        <p className="text-xs text-[#3B211B]/60 max-w-sm mx-auto">
                          {allInquiries.length === 0
                            ? 'No customer inquiries recorded yet. When users submit custom orders from the website, they will appear here.'
                            : 'No customer orders match your selected search or filter.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {filteredInquiries.map((inq) => {
                          const isRead = inq.status === 'read' || inq.isRead === true;
                          const isReplied = inq.status === 'replied';
                          const isClosed = inq.status === 'closed';

                          // Extract phone number from field or message
                          const extractedPhone =
                            inq.userPhone ||
                            inq.message?.match(/Phone:\s*([^\n\r]+)/)?.[1]?.trim() ||
                            '';

                          return (
                            <div
                              key={inq.id}
                              className={`p-5 rounded-2xl border transition-all shadow-2xs space-y-3 ${
                                !isRead && !isReplied && !isClosed
                                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                                  : 'bg-white border-[#E8D6C3]'
                              }`}
                            >
                              {/* Order Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8D6C3]/60 pb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Read / Unread Status Badge */}
                                  {!isRead && !isReplied && !isClosed ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                      New / Unread
                                    </span>
                                  ) : isReplied ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                                      <Check className="w-3 h-3" /> Replied
                                    </span>
                                  ) : isClosed ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold uppercase tracking-wider">
                                      Closed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-[#3B211B]/70 text-[10px] font-semibold uppercase tracking-wider">
                                      <Check className="w-3 h-3 text-[#C47B55]" /> Read
                                    </span>
                                  )}

                                  <span className="text-xs font-bold text-[#3B211B]">{inq.subject}</span>
                                </div>

                                <div className="text-[11px] text-[#3B211B]/60 font-mono">
                                  {inq.createdAt
                                    ? new Date(inq.createdAt).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                      })
                                    : 'Recent'}
                                </div>
                              </div>

                              {/* Order Message Details */}
                              <div className="bg-[#F8F0E5]/60 p-3.5 rounded-xl border border-[#E8D6C3]/60 text-xs text-[#3B211B]/90 font-mono whitespace-pre-wrap leading-relaxed">
                                {inq.message}
                              </div>

                              {/* Customer Profile & Actions Footer */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                <div className="text-xs text-[#3B211B]/80 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span>
                                    Customer: <strong>{inq.userName || 'Anonymous'}</strong>
                                  </span>
                                  <span>&bull;</span>
                                  <a
                                    href={`mailto:${inq.userEmail}`}
                                    className="text-[#C47B55] hover:underline"
                                  >
                                    {inq.userEmail}
                                  </a>
                                  {extractedPhone && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="font-mono text-[#3B211B]">
                                        Tel: {extractedPhone}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Action Buttons: Mark as Read, Contact, Delete */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* WhatsApp Quick Reply */}
                                  {extractedPhone && (
                                    <a
                                      href={`https://wa.me/91${extractedPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${inq.userName || 'there'}, thank you for contacting BrowineGirlCakes regarding your order inquiry!`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold transition-all shadow-2xs"
                                      title="Reply directly to customer on WhatsApp"
                                    >
                                      <MessageCircle className="w-3 h-3 text-white" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}

                                  {/* Mark as Read / Unread Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleInquiryRead(inq)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                                      isRead
                                        ? 'bg-white hover:bg-stone-50 border-[#E8D6C3] text-[#3B211B]/80'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs font-bold'
                                    }`}
                                    title={isRead ? 'Mark as Unread' : 'Mark as Read'}
                                  >
                                    {isRead ? (
                                      <>
                                        <EyeOff className="w-3 h-3 text-[#3B211B]/60" />
                                        <span>Mark Unread</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3 h-3 text-white" />
                                        <span>Mark as Read</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Status Selector */}
                                  <select
                                    value={inq.status || (isRead ? 'read' : 'new')}
                                    onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                                    className="p-1 px-2 bg-[#F8F0E5] border border-[#E8D6C3] rounded-lg text-xs font-semibold text-[#3B211B]"
                                  >
                                    <option value="new">new</option>
                                    <option value="read">read</option>
                                    <option value="replied">replied</option>
                                    <option value="closed">closed</option>
                                  </select>

                                  {/* Delete Facility with Inline Confirmation */}
                                  {deletingInquiryId === inq.id ? (
                                    <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-300 rounded-lg animate-in fade-in shadow-2xs">
                                      <span className="text-[10px] font-bold text-red-700 px-1">
                                        Delete order?
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteInquiry(inq.id, inq.userName)}
                                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                      >
                                        Yes, Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeletingInquiryId(null)}
                                        className="px-2 py-1 bg-white hover:bg-stone-100 text-[#3B211B] rounded text-[10px] font-semibold border border-[#E8D6C3] cursor-pointer transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setDeletingInquiryId(inq.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                      title="Delete customer order"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 7: CUSTOM SHOWCASE (10 BROWNIES) */}
          {activeTab === 'custom' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#C47B55]" />
                    Custom Order Showcase ({customBrownies.length} Brownies)
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                    Custom Brownie Showcase Management
                  </h3>
                  <p className="text-xs text-[#3B211B]/70 mt-1">
                    Manage the 10 featured artisan brownies displayed on the dedicated Custom Orders page. Easily upload photos directly from your device, edit descriptions, origin stories, and cocoa percentages.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingCustomBrownie(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3B211B] hover:bg-[#23120E] text-[#F8F0E5] text-xs font-bold transition-all shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-[#E5A962]" />
                  <span>+ Add Custom Brownie</span>
                </button>
              </div>

              {/* Add New Custom Brownie Form */}
              {isAddingCustomBrownie && (
                <div className="p-6 bg-white rounded-3xl border-2 border-[#C47B55] shadow-lg space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-lg font-bold text-[#3B211B] flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#C47B55]" />
                      Add New Custom Showcase Brownie
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomBrownie(false)}
                      className="text-xs text-[#3B211B]/60 hover:text-black font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-3">
                      <div>
                        <label className="text-xs font-bold text-[#3B211B] block mb-1">Brownie Name *</label>
                        <input
                          type="text"
                          value={newCustomBrownie.name}
                          onChange={(e) => setNewCustomBrownie({ ...newCustomBrownie, name: e.target.value })}
                          placeholder="e.g. Signature Gold Flake Ganache Brownie"
                          className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-[#3B211B] block mb-1">Origin / Subtitle</label>
                          <input
                            type="text"
                            value={newCustomBrownie.subtitle}
                            onChange={(e) => setNewCustomBrownie({ ...newCustomBrownie, subtitle: e.target.value })}
                            placeholder="e.g. 74% Belgian Dark & Fleur de Sel"
                            className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#3B211B] block mb-1">Cocoa Percentage</label>
                          <input
                            type="text"
                            value={newCustomBrownie.cocoaPercentage}
                            onChange={(e) => setNewCustomBrownie({ ...newCustomBrownie, cocoaPercentage: e.target.value })}
                            placeholder="e.g. 74% Dark"
                            className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#3B211B] block mb-1">Description & Tasting Notes *</label>
                        <textarea
                          rows={3}
                          value={newCustomBrownie.description}
                          onChange={(e) => setNewCustomBrownie({ ...newCustomBrownie, description: e.target.value })}
                          placeholder="Rich slow-baked brownie folded with couverture ganache, crisp crinkly crust, and molten center..."
                          className="w-full p-2.5 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B]"
                        />
                      </div>
                    </div>

                    {/* Image Upload Area */}
                    <div className="space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-[#3B211B]">Photo *</label>
                          <LocalImageUploader
                            label="Upload from Device"
                            onImageSelected={(dataUrl) => {
                              setNewCustomBrownie({ ...newCustomBrownie, image: dataUrl });
                              triggerSuccess('Loaded local photo from device!');
                            }}
                          />
                        </div>

                        <div className="h-36 rounded-2xl overflow-hidden bg-black/10 border border-[#E8D6C3] mb-2">
                          <img
                            src={newCustomBrownie.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <input
                          type="text"
                          value={newCustomBrownie.image}
                          onChange={(e) => setNewCustomBrownie({ ...newCustomBrownie, image: e.target.value })}
                          placeholder="Paste image URL or use device upload"
                          className="w-full p-2 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-lg text-[11px] font-mono"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomBrownie(false)}
                          className="px-4 py-2 text-xs font-semibold text-[#3B211B] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newCustomBrownie.name.trim()) {
                              alert('Please provide a name for the custom brownie.');
                              return;
                            }
                            await addCustomBrownie(newCustomBrownie);
                            setIsAddingCustomBrownie(false);
                            setNewCustomBrownie({
                              name: '',
                              subtitle: '',
                              description: '',
                              price: '',
                              image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=85&w=800&auto=format&fit=crop',
                              badge: 'Artisan Custom',
                              cocoaPercentage: '70% Dark',
                              flavorNotes: ['Single Origin Cocoa'],
                            });
                            triggerSuccess(`Added custom brownie "${newCustomBrownie.name}"!`);
                          }}
                          className="px-5 py-2.5 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                        >
                          Save Custom Brownie
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Brownies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {customBrownies.map((brownie, bIdx) => {
                  const isExpanded = expandedCustomBrownieId === brownie.id;

                  return (
                    <div
                      key={brownie.id}
                      className="bg-white p-5 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-4 hover:border-[#C47B55]/50 transition-all"
                    >
                      {/* Photo and Header */}
                      <div className="flex gap-4 items-start">
                        <div className="relative group shrink-0">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/10 border border-[#E8D6C3]">
                            <img
                              src={brownie.image}
                              alt={brownie.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-[#3B211B] text-[#E5A962] font-mono text-[11px] font-bold flex items-center justify-center shadow-xs">
                            {bIdx + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C47B55] bg-[#F8F0E5] px-2 py-0.5 rounded-md">
                              {brownie.cocoaPercentage || 'Artisan Cocoa'}
                            </span>
                            <LocalImageUploader
                              label="Upload Photo"
                              onImageSelected={async (dataUrl) => {
                                await updateCustomBrownie(brownie.id, { image: dataUrl });
                                triggerSuccess(`Updated photo for "${brownie.name}" directly from device!`);
                              }}
                            />
                          </div>

                          <input
                            type="text"
                            value={brownie.name}
                            onChange={(e) => updateCustomBrownie(brownie.id, { name: e.target.value })}
                            className="w-full p-2 bg-[#F8F0E5]/50 border border-[#E8D6C3] rounded-xl text-sm font-bold text-[#3B211B]"
                            placeholder="Brownie Name"
                          />

                          <input
                            type="text"
                            value={brownie.subtitle}
                            onChange={(e) => updateCustomBrownie(brownie.id, { subtitle: e.target.value })}
                            className="w-full p-1.5 bg-[#F8F0E5]/30 border border-[#E8D6C3] rounded-lg text-xs text-[#3B211B]/80"
                            placeholder="Subtitle / Origin"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[#3B211B]/70 block mb-1">
                          Description (Shown in Morphing Dialog Modal)
                        </label>
                        <textarea
                          rows={3}
                          value={brownie.description}
                          onChange={(e) => updateCustomBrownie(brownie.id, { description: e.target.value })}
                          className="w-full p-2.5 bg-[#F8F0E5]/40 border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] leading-relaxed"
                        />
                      </div>

                      {/* Optional Expandable Details */}
                      {isExpanded && (
                        <div className="p-3 bg-[#F8F0E5]/60 rounded-xl space-y-2 text-xs border border-[#E8D6C3] animate-in fade-in">
                          <div>
                            <label className="text-[10px] font-bold text-[#3B211B] block">Direct Image URL</label>
                            <input
                              type="text"
                              value={brownie.image}
                              onChange={(e) => updateCustomBrownie(brownie.id, { image: e.target.value })}
                              className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-[11px] font-mono text-[#3B211B]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-[#3B211B] block">Cocoa %</label>
                              <input
                                type="text"
                                value={brownie.cocoaPercentage}
                                onChange={(e) => updateCustomBrownie(brownie.id, { cocoaPercentage: e.target.value })}
                                className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#3B211B] block">Badge Label</label>
                              <input
                                type="text"
                                value={brownie.badge || ''}
                                onChange={(e) => updateCustomBrownie(brownie.id, { badge: e.target.value })}
                                className="w-full p-1.5 bg-white border border-[#E8D6C3] rounded-md text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#E8D6C3]/50">
                        <button
                          type="button"
                          onClick={() => setExpandedCustomBrownieId(isExpanded ? null : brownie.id)}
                          className="text-xs text-[#C47B55] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Hide Image URL' : 'Edit Image URL & Badge'}</span>
                        </button>

                        {deletingCustomId === brownie.id ? (
                          <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-300 rounded-xl animate-in fade-in">
                            <span className="text-[10px] font-bold text-red-700 px-1">Remove item?</span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await deleteCustomBrownie(brownie.id);
                                setDeletingCustomId(null);
                                triggerSuccess(`Removed "${brownie.name}"`);
                              }}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingCustomId(null);
                              }}
                              className="px-2 py-0.5 bg-white text-[#3B211B] rounded-md text-[10px] font-semibold cursor-pointer border border-[#E8D6C3]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeletingCustomId(brownie.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs flex items-center gap-1 cursor-pointer font-semibold transition-colors"
                            title="Remove custom brownie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: ADMIN ACCESS & TEAM MANAGEMENT */}
          {activeTab === 'admins' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              {/* Header */}
              <div>
                <span className="text-xs font-bold text-[#C47B55] uppercase tracking-wider">
                  Security & Team Access
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#3B211B] mt-0.5">
                  Authorized Bakery Administrators
                </h3>
                <p className="text-xs text-[#3B211B]/70 mt-1">
                  Manage team members who are permitted to access this administration console. Authorized administrators can update menu items, class schedules, site content, and view customer orders.
                </p>
              </div>

              {/* Status Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#C47B55]/15 text-[#C47B55] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#3B211B]/60 tracking-wider">
                      Authorized Admins
                    </p>
                    <p className="text-2xl font-bold text-[#3B211B]">
                      {authorizedAdmins.length}
                    </p>
                    <p className="text-[11px] text-[#25D366] font-semibold">Active Access</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E5A962]/15 text-[#3B211B] flex items-center justify-center shrink-0">
                    <Cake className="w-6 h-6 text-[#C47B55]" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-[#3B211B]/60 tracking-wider">
                      Primary Bakery Owner
                    </p>
                    <p className="text-xs font-bold text-[#3B211B] truncate" title={OFFICIAL_OWNER_EMAIL}>
                      {OFFICIAL_OWNER_EMAIL}
                    </p>
                    <span className="inline-block px-2 py-0.5 bg-[#E5A962]/30 text-[#3B211B] text-[10px] font-bold rounded-md mt-0.5">
                      Verified Owner
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8D6C3] shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#3B211B]/60 tracking-wider">
                      Real-Time Sync
                    </p>
                    <p className="text-xs font-bold text-[#3B211B]">Cloud & Local Safe</p>
                    <p className="text-[11px] text-[#3B211B]/60 mt-0.5">Syncs across devices</p>
                  </div>
                </div>
              </div>

              {/* Add New Administrator Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8D6C3]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#C47B55] text-white flex items-center justify-center shadow-xs">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-bold text-[#3B211B]">
                        Authorize New Administrator
                      </h4>
                      <p className="text-xs text-[#3B211B]/60">
                        Add a colleague or assistant baker by email to grant them admin privileges.
                      </p>
                    </div>
                  </div>
                </div>

                {adminActionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{adminActionError}</span>
                  </div>
                )}

                <form onSubmit={handleAddAdminSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#C47B55]" />
                        Administrator Email Address *
                      </label>
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => {
                          setNewAdminEmail(e.target.value);
                          if (adminActionError) setAdminActionError(null);
                        }}
                        placeholder="e.g. colleague@gmail.com"
                        required
                        className="w-full p-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                      />
                      <p className="text-[11px] text-[#3B211B]/60 mt-1">
                        They will be able to sign in via Google or password using this email.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#C47B55]" />
                        Full Name or Role Description
                      </label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="e.g. Chef Priya (Head of Pastry)"
                        className="w-full p-3 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-sm font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                      />
                      <p className="text-[11px] text-[#3B211B]/60 mt-1">
                        Helpful label to identify this administrator in the team roster.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingAdmin || !newAdminEmail.trim()}
                      className="px-6 py-2.5 rounded-xl bg-[#C47B55] hover:bg-[#D98B5F] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingAdmin ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Authorizing...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Grant Admin Privileges</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Authorized Administrators List */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8D6C3] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8D6C3]">
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#3B211B]">
                      Active Administrators Roster ({authorizedAdmins.length})
                    </h4>
                    <p className="text-xs text-[#3B211B]/60">
                      Everyone listed below has full access to manage the website and bakery operations.
                    </p>
                  </div>

                  {/* Search filter */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#3B211B]/40" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="Filter by name or email..."
                      className="w-full pl-8 pr-3 py-1.5 bg-[#F8F0E5]/60 border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {authorizedAdmins
                    .filter((a) => {
                      if (!adminSearch.trim()) return true;
                      const q = adminSearch.toLowerCase();
                      return a.email.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
                    })
                    .map((adm) => {
                      const isOwner = adm.email.toLowerCase() === OFFICIAL_OWNER_EMAIL.toLowerCase();
                      const isRevoking = revokingAdminEmail === adm.email;

                      return (
                        <div
                          key={adm.email}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            isOwner
                              ? 'bg-[#F8F0E5]/70 border-[#E5A962]/60 shadow-xs'
                              : 'bg-white border-[#E8D6C3] hover:border-[#C47B55]/50 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                isOwner
                                  ? 'bg-[#C47B55] text-white shadow-sm'
                                  : 'bg-[#3B211B] text-[#E8D6C3]'
                              }`}
                            >
                              {adm.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-serif text-sm font-bold text-[#3B211B]">
                                  {adm.name}
                                </span>
                                {isOwner ? (
                                  <span className="px-2 py-0.5 rounded-full bg-[#E5A962] text-[#23120E] text-[10px] font-bold uppercase tracking-wider">
                                    Primary Owner
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-[#3B211B]/10 text-[#3B211B] text-[10px] font-bold uppercase tracking-wider">
                                    Co-Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#3B211B]/80 font-mono truncate">{adm.email}</p>
                              <p className="text-[10px] text-[#3B211B]/50 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Added {new Date(adm.addedAt).toLocaleDateString()} by {adm.addedBy}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(adm.email);
                                triggerSuccess(`Copied "${adm.email}" to clipboard!`);
                              }}
                              className="p-2 rounded-xl bg-[#F8F0E5] hover:bg-[#E8D6C3] text-[#3B211B] text-xs transition-colors cursor-pointer"
                              title="Copy email address"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {isOwner ? (
                              <span
                                className="text-[11px] font-semibold text-[#3B211B]/40 px-2 py-1 select-none"
                                title="The primary bakery owner cannot be deleted."
                              >
                                Protected Owner
                              </span>
                            ) : isRevoking ? (
                              <div className="flex items-center gap-1.5 p-1 bg-red-50 border border-red-200 rounded-xl">
                                <span className="text-[10px] font-bold text-red-700 px-1">Revoke access?</span>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAdmin(adm.email)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                >
                                  Yes, Remove
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRevokingAdminEmail(null)}
                                  className="px-2 py-1 bg-white text-[#3B211B] border border-[#E8D6C3] rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRevokingAdminEmail(adm.email)}
                                className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Access</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Portal Access Guide Card */}
              <div className="p-6 rounded-3xl bg-[#3B211B] text-[#F8F0E5] border border-[#C47B55]/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#E5A962]" />
                    <h4 className="font-serif text-base font-bold text-[#F8F0E5]">
                      How to Share Access with Authorized Administrators
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/#admin`;
                      navigator.clipboard.writeText(url);
                      setCopiedLink(true);
                      triggerSuccess('Copied Admin Dashboard URL to clipboard!');
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#C47B55] hover:bg-[#D98B5F] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Admin Portal Link'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#E8D6C3]/80 pt-1">
                  <div className="p-3 rounded-xl bg-white/5 space-y-1">
                    <p className="font-bold text-[#E5A962]">1. Google Account Sign-In</p>
                    <p className="text-[11px]">
                      Any authorized person can click "Sign In with Google" using their authorized email. The system immediately recognizes their admin privileges.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 space-y-1">
                    <p className="font-bold text-[#E5A962]">2. Direct Password Access</p>
                    <p className="text-[11px]">
                      Admins can type their email and the master bakery password (<strong>admin123</strong>) to sign in directly from any workstation or phone.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[#E8D6C3]/60 pt-1">
                  Tip: On any page of the storefront, press <kbd className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-white text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-white text-[10px]">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-white text-[10px]">A</kbd> to quickly jump to the Admin Console.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
