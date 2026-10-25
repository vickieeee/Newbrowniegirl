import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { SEOHead } from './components/SEOHead';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { BrownieGallery } from './components/BrownieGallery';
import { AboutSection } from './components/AboutSection';
import { AchievementSection } from './components/AchievementSection';
import { ClassModal } from './components/ClassModal';
import { ContactModal } from './components/ContactModal';
import { CreationsDrawer } from './components/CreationsDrawer';
import { MyActivityModal } from './components/MyActivityModal';
import { AdminApp } from './admin/AdminApp';
import { CustomOrdersPage } from './components/CustomOrdersPage';
import { Footer } from './components/Footer';
import { IntroScrambleOverlay } from './components/IntroScrambleOverlay';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { BrownieItem, SIGNATURE_BROWNIES } from './data/brownies';

function MainBakeryWebsite() {
  const [currentPage, setCurrentPage] = useState<'home' | 'custom-orders'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#custom-orders' || hash.startsWith('#custom-orders') || hash === '#/custom-orders') {
        return 'custom-orders';
      }
    }
    return 'home';
  });

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [creationsDrawerOpen, setCreationsDrawerOpen] = useState(false);
  const [selectedBrownie, setSelectedBrownie] = useState<BrownieItem | null>(null);
  const [myActivityOpen, setMyActivityOpen] = useState(false);

  // Sync hash with custom-orders page
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#custom-orders' || hash.startsWith('#custom-orders') || hash === '#/custom-orders') {
        setCurrentPage('custom-orders');
      } else if (!hash.includes('admin')) {
        setCurrentPage('home');
      }
    };

    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  const handleOpenCustomOrders = () => {
    window.location.hash = '#custom-orders';
    setCurrentPage('custom-orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    window.location.hash = '';
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers for Hero Carousel CTAs
  const handleExploreCreations = () => {
    setSelectedBrownie(SIGNATURE_BROWNIES[0]);
    setCreationsDrawerOpen(true);
  };

  const handleJoinClass = () => {
    setSelectedClassId('brownie-mastery');
    setClassModalOpen(true);
  };

  const handleGetInTouch = () => {
    setContactModalOpen(true);
  };

  const handleRegisterInterest = () => {
    setSelectedClassId('artisan-caramels-swirls');
    setClassModalOpen(true);
  };

  // Handler for gallery brownie click
  const handleSelectBrownie = (brownie: BrownieItem) => {
    setSelectedBrownie(brownie);
    setCreationsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F0E5] text-[#3B211B] flex flex-col relative">
      {/* Black Text-Scramble Intro Animation Screen */}
      <IntroScrambleOverlay />

      {/* Floating WhatsApp Quick Action Button */}
      <FloatingWhatsApp phoneNumber="7339651529" />

      {/* 1. Header & Navigation Bar (Pristine Customer Storefront) */}
      <Navbar
        onOpenCreations={handleExploreCreations}
        onOpenClasses={handleJoinClass}
        onOpenContact={handleGetInTouch}
        onOpenCustomOrders={handleOpenCustomOrders}
        onOpenMyActivity={() => setMyActivityOpen(true)}
      />

      <main className="flex-1">
        {currentPage === 'custom-orders' ? (
          <CustomOrdersPage
            onBackToHome={handleBackToHome}
            onOpenClasses={handleJoinClass}
          />
        ) : (
          <>
            {/* 2. HERO SECTION — FULL-WIDTH HERO BANNER CAROUSEL */}
            <HeroCarousel
              onExploreCreations={handleExploreCreations}
              onJoinClass={handleJoinClass}
              onGetInTouch={handleGetInTouch}
              onRegisterInterest={handleRegisterInterest}
              onOpenCustomOrders={handleOpenCustomOrders}
            />

            {/* 3. MENU SECTION — INFINITE SLIDER WITH PROGRESSIVE BLUR */}
            <BrownieGallery
              onSelectBrownie={handleSelectBrownie}
              onViewAllCreations={handleExploreCreations}
              onOpenCustomOrders={handleOpenCustomOrders}
            />

            {/* 4. ACHIEVEMENTS & MILESTONES SECTION */}
            <AchievementSection
              onOpenContact={handleGetInTouch}
              onOpenClasses={handleJoinClass}
            />

            {/* 5. THE BAKER BEHIND THE BRAND & BAKING STUDIO */}
            <AboutSection
              onJoinClass={handleJoinClass}
              onExploreCreations={handleExploreCreations}
            />
          </>
        )}
      </main>

      {/* 6. Footer (Pristine Customer Storefront) */}
      <Footer
        onOpenCreations={handleExploreCreations}
        onOpenClasses={handleJoinClass}
        onOpenContact={handleGetInTouch}
        onOpenCustomOrders={handleOpenCustomOrders}
        onOpenMyActivity={() => setMyActivityOpen(true)}
      />

      {/* Interactive Modals & Drawers */}
      <ClassModal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        selectedClassId={selectedClassId}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      <CreationsDrawer
        isOpen={creationsDrawerOpen}
        onClose={() => setCreationsDrawerOpen(false)}
        selectedBrownie={selectedBrownie}
        onSelectBrownie={(b) => setSelectedBrownie(b)}
        onOrderNow={handleOpenCustomOrders}
        onOpenCustomOrders={handleOpenCustomOrders}
      />

      <MyActivityModal
        isOpen={myActivityOpen}
        onClose={() => setMyActivityOpen(false)}
        onExploreCreations={handleExploreCreations}
        onBookClass={handleJoinClass}
      />
    </div>
  );
}

function RootApp() {
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();

    return (
      path === '/admin' ||
      path.startsWith('/admin') ||
      hash === '#admin' ||
      hash.startsWith('#admin') ||
      hash.startsWith('#/admin') ||
      search.includes('admin=true') ||
      search.includes('view=admin')
    );
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);

    // Keyboard shortcut for bakery owners to easily access /#admin (Ctrl+Shift+A or Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        window.location.hash = '#admin';
        setIsAdminRoute(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateToWebsite = () => {
    window.location.hash = '';
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/');
    }
    setIsAdminRoute(false);
  };

  return (
    <>
      <SEOHead isAdmin={isAdminRoute} />
      {isAdminRoute ? (
        <AdminApp onBackToWebsite={navigateToWebsite} />
      ) : (
        <MainBakeryWebsite />
      )}
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ContentProvider>
          <RootApp />
        </ContentProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
