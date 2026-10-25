import React, { useState, useEffect } from 'react';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogContainer,
  useMorphingDialog,
} from '@/components/core/morphing-dialog';
import { ScrollArea } from '@/components/website/scroll-area';
import { SIGNATURE_BROWNIES, BrownieItem } from '../data/brownies';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { getEffectiveUserName } from '../utils/formatters';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Send,
  Phone,
  Mail,
  ChefHat,
  Gift,
  MessageCircle,
  X,
  Plus,
} from 'lucide-react';

interface CustomOrdersPageProps {
  onBackToHome: () => void;
  onOpenClasses?: () => void;
}

interface AddToInquiryDialogButtonProps {
  brownieName: string;
  isSelected: boolean;
  onToggle: (name: string) => void;
  onFeedback: (msg: string) => void;
}

const AddToInquiryDialogButton: React.FC<AddToInquiryDialogButtonProps> = ({
  brownieName,
  isSelected,
  onToggle,
  onFeedback,
}) => {
  const { setIsOpen } = useMorphingDialog();

  const handleAction = () => {
    onToggle(brownieName);
    const msg = !isSelected
      ? `Added "${brownieName}" to your custom batch inquiry!`
      : `Removed "${brownieName}" from custom selection.`;
    onFeedback(msg);
    // Close the morphing dialog modal so the user returns to the page
    setIsOpen(false);
    // Smoothly scroll down to the inquiry form
    setTimeout(() => {
      const el = document.getElementById('custom-order-form');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <button
      type="button"
      onClick={handleAction}
      className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-2 ${
        isSelected
          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
          : 'bg-[#C47B55] hover:bg-[#D98B5F] text-white'
      }`}
    >
      <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-emerald-200' : 'text-white/80'}`} />
      <span>{isSelected ? '✓ In Custom Inquiry (Selected)' : '+ Add to Custom Inquiry'}</span>
    </button>
  );
};

export const CustomOrdersPage: React.FC<CustomOrdersPageProps> = ({
  onBackToHome,
  onOpenClasses,
}) => {
  const { menuItems, customBrownies, settings } = useContent();
  const { user, userProfile, submitInquiry } = useAuth();

  // Pick 10 artisan brownies for the custom order portfolio showcase
  const allBrownies =
    customBrownies && customBrownies.length > 0
      ? customBrownies
      : menuItems && menuItems.length >= 10
      ? menuItems
      : SIGNATURE_BROWNIES;
  const portfolioBrownies = allBrownies.slice(0, 10);
  const whatsappNum = settings.whatsappNumber || '7339651529';

  // Custom Order Inquiry Form State
  const [eventType, setEventType] = useState('Wedding Favor & Dessert Table');
  const [batchSize, setBatchSize] = useState('50 Artisan Pieces');
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([
    portfolioBrownies[0]?.name || 'Artisan Double Fudge',
    portfolioBrownies[1]?.name || 'Salted Caramel Pecan Swirl',
  ]);
  const [eventDate, setEventDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Pre-fill user profile info if signed in
  useEffect(() => {
    if (user) {
      const effectiveName = getEffectiveUserName(user, userProfile);
      setCustomerName(effectiveName);
      setCustomerEmail(user.email || '');
    }
  }, [user, userProfile]);

  const toggleFlavor = (flavorName: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(flavorName)
        ? prev.filter((f) => f !== flavorName)
        : [...prev, flavorName]
    );
  };

  const selectAllFlavors = () => {
    setSelectedFlavors(portfolioBrownies.map((b) => b.name));
    triggerFeedback('Selected all 10 artisan brownie flavors for your inquiry!');
  };

  const clearAllFlavors = () => {
    setSelectedFlavors([]);
    triggerFeedback('Cleared custom flavor selection.');
  };

  const triggerFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const handleCustomOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Please enter your contact phone number.');
      return;
    }
    if (!customerEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const subject = `Custom Order: ${eventType} (${batchSize})`;
      const messageBody = `
=== CUSTOM ORDER REQUEST ===
Contact Name: ${customerName}
Contact Email: ${customerEmail}
Contact Phone: ${customerPhone}
Event Type: ${eventType}
Target Date: ${eventDate || 'Flexible / To be confirmed'}
Estimated Batch Size: ${batchSize}
Selected Flavors: ${selectedFlavors.length > 0 ? selectedFlavors.join(', ') : 'Chef Choice Selection'}

Special Requests / Dietary Notes:
${specialNotes || 'None specified'}
      `.trim();

      await submitInquiry(subject, messageBody, {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to submit custom order request. Please try again or chat via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappInquiryUrl = `https://wa.me/91${whatsappNum.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello BrowineGirlCakes! I would like to inquire about a custom order.
Event: ${eventType}
Batch Size: ${batchSize}
Target Date: ${eventDate || 'To be decided'}
Flavors: ${selectedFlavors.join(', ') || 'Chef Choice Selection'}
Name: ${customerName || 'Customer'}
Phone: ${customerPhone || ''}
Notes: ${specialNotes || 'None'}`
  )}`;

  return (
    <div className="min-h-screen bg-[#F8F0E5] text-[#3B211B] flex flex-col">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#1F0F0C] text-[#F8F0E5] border-b border-[#3B211B] px-4 sm:px-8 py-4 shadow-lg backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-[#E8D6C3] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            <span className="text-[#E8D6C3]/40">|</span>

            <div>
              <h1 className="font-brand text-base sm:text-lg font-bold tracking-wider text-[#F8F0E5]">
                BrowineGirlCakes
              </h1>
              <p className="text-[10px] text-[#C47B55] uppercase tracking-widest font-semibold hidden sm:block">
                Bespoke Catering & Custom Brownie Batches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href={`https://wa.me/91${whatsappNum.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp:</span>
              <span>{whatsappNum}</span>
            </a>

            <button
              onClick={() => {
                const el = document.getElementById('custom-order-form');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              Inquiry Form ({selectedFlavors.length})
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#23120E] text-[#F8F0E5] py-16 sm:py-20 px-4 sm:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C47B55]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3B211B] text-[#E5A962] border border-[#C47B55]/40 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Custom Orders & Event Catering
          </div>

          <h2 className="font-gallery text-3xl sm:text-5xl font-bold tracking-tight text-[#F8F0E5]">
            Bespoke Brownie Collections for Your Occasion
          </h2>

          <p className="text-sm sm:text-base text-[#E8D6C3]/80 max-w-2xl mx-auto leading-relaxed">
            We handcraft customized brownie spreads, personalized foil-stamped gift boxes, wedding favor squares, and luxury dessert table towers. Tap any of our 10 chef recipes below to inspect details and add them to your custom batch.
          </p>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-[#E5A962]">
            <span className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#C47B55]" /> Custom Packaging Available
            </span>
            <span className="flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-[#C47B55]" /> Slow-Baked Small Batches
            </span>
          </div>
        </div>
      </section>

      {/* 10 MORPHING DIALOG BROWNIES SECTION */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#C47B55] block mb-1">
              Interactive Flavor Portfolio
            </span>
            <h3 className="font-gallery text-2xl sm:text-3xl font-bold text-[#3B211B]">
              10 Signature Brownies for Custom Orders
            </h3>
            <p className="text-xs sm:text-sm text-[#3B211B]/70 mt-1">
              Click any brownie to open its Morphing Dialog story, or tap &ldquo;Add to Inquiry&rdquo; inside to select it for your custom batch.
            </p>
          </div>

          {/* Selection control bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#3B211B] text-[#E5A962]">
              {selectedFlavors.length} of 10 Selected
            </span>
            <button
              type="button"
              onClick={selectAllFlavors}
              className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 border border-[#E8D6C3] text-[#3B211B] font-semibold cursor-pointer transition-colors"
            >
              Select All 10
            </button>
            {selectedFlavors.length > 0 && (
              <button
                type="button"
                onClick={clearAllFlavors}
                className="text-xs px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-[#3B211B]/70 font-semibold cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {actionFeedback}
            </span>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Grid of 10 Morphing Dialog Brownies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portfolioBrownies.map((brownie, idx) => {
            const isSelected = selectedFlavors.includes(brownie.name);

            return (
              <MorphingDialog
                key={brownie.id || idx}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 24,
                }}
              >
                <MorphingDialogTrigger
                  style={{
                    borderRadius: '16px',
                  }}
                  className={`w-full border bg-white hover:border-[#C47B55] hover:shadow-md transition-all shadow-xs text-left ${
                    isSelected ? 'border-[#C47B55] ring-2 ring-[#C47B55]/20' : 'border-gray-200/80'
                  }`}
                >
                  <div className="flex items-center space-x-4 p-4">
                    <MorphingDialogImage
                      src={brownie.image}
                      alt={brownie.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover object-top shrink-0"
                      style={{
                        borderRadius: '12px',
                      }}
                    />
                    <div className="flex flex-col items-start justify-center space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between w-full">
                        <MorphingDialogTitle className="text-sm sm:text-base font-bold text-black font-gallery truncate">
                          {brownie.name}
                        </MorphingDialogTitle>
                        {brownie.badge && (
                          <span className="text-[10px] font-bold text-[#C47B55] bg-[#E8D6C3]/50 px-2 py-0.5 rounded-full shrink-0">
                            {brownie.badge}
                          </span>
                        )}
                      </div>
                      <MorphingDialogSubtitle className="text-xs text-gray-500 truncate">
                        {brownie.subtitle || brownie.cocoaPercentage}
                      </MorphingDialogSubtitle>

                      <div className="flex items-center justify-between w-full pt-1">
                        <p className="text-[11px] text-gray-500 truncate max-w-[180px] sm:max-w-[240px]">
                          {brownie.flavorNotes.slice(0, 2).join(' • ')}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-[#F8F0E5] text-[#C47B55] border border-[#E8D6C3]'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3 h-3 ${isSelected ? 'text-emerald-600' : 'text-[#C47B55]'}`}
                          />
                          <span>{isSelected ? 'In Inquiry ✓' : 'Inspect & Add +'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </MorphingDialogTrigger>

                <MorphingDialogContainer>
                  <MorphingDialogContent
                    style={{
                      borderRadius: '24px',
                    }}
                    className="relative h-auto w-[92vw] max-w-[560px] border border-gray-100 bg-white shadow-2xl overflow-hidden"
                  >
                    <ScrollArea className="h-[82vh] sm:h-[86vh]" type="scroll">
                      <div className="relative p-6 sm:p-8">
                        {/* Image Hero */}
                        <div className="flex justify-center py-6">
                          <MorphingDialogImage
                            src={brownie.image}
                            alt={brownie.name}
                            className="h-auto w-[240px] sm:w-[280px] rounded-2xl shadow-xl object-cover"
                          />
                        </div>

                        {/* Header */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-wider font-semibold text-[#C47B55]">
                              {brownie.cocoaPercentage}
                            </span>
                            {brownie.badge && (
                              <span className="text-[10px] uppercase font-bold text-[#3B211B] bg-[#E8D6C3] px-2 py-0.5 rounded-full">
                                {brownie.badge}
                              </span>
                            )}
                          </div>
                          <MorphingDialogTitle className="text-2xl sm:text-3xl font-bold text-black font-gallery">
                            {brownie.name}
                          </MorphingDialogTitle>
                          <MorphingDialogSubtitle className="font-medium text-gray-500 text-sm">
                            {brownie.subtitle}
                          </MorphingDialogSubtitle>
                        </div>

                        {/* Description & Artisan Story */}
                        <div className="mt-4 text-sm text-gray-700 space-y-3 leading-relaxed">
                          <p>{brownie.description}</p>
                          <p>
                            Slow-baked using pure European butter, farm eggs, and single-origin Valrhona chocolate. Each batch is baked in deck ovens to achieve our legendary paper-thin crackle crust and ultra-dense, melt-in-the-mouth center.
                          </p>
                        </div>

                        {/* Tasting Profile Notes */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#C47B55] block mb-2">
                            Flavor & Texture Notes
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {brownie.flavorNotes.map((note, nIdx) => (
                              <span
                                key={nIdx}
                                className="px-3 py-1 rounded-full bg-[#E8D6C3]/50 text-[#3B211B] text-xs font-semibold"
                              >
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Custom Order Action in Modal */}
                        <div className="mt-8 p-4 rounded-2xl bg-[#F8F0E5] border border-[#E8D6C3] flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-[#3B211B]">
                              Include in Custom Inquiry
                            </p>
                            <p className="text-[11px] text-[#3B211B]/70">
                              Adds this recipe to your custom event proposal
                            </p>
                          </div>

                          <AddToInquiryDialogButton
                            brownieName={brownie.name}
                            isSelected={isSelected}
                            onToggle={toggleFlavor}
                            onFeedback={triggerFeedback}
                          />
                        </div>
                      </div>
                    </ScrollArea>
                    <MorphingDialogClose className="text-zinc-600 hover:text-black" />
                  </MorphingDialogContent>
                </MorphingDialogContainer>
              </MorphingDialog>
            );
          })}
        </div>
      </section>

      {/* CUSTOM ORDER CONSULTATION FORM SECTION */}
      <section
        id="custom-order-form"
        className="py-16 sm:py-20 px-4 sm:px-8 bg-white border-t border-[#E8D6C3]"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C47B55]">
              Consultation & Tasting Request
            </span>
            <h3 className="font-gallery text-3xl sm:text-4xl font-bold text-[#3B211B]">
              Request a Custom Order Batch
            </h3>
            <p className="text-xs sm:text-sm text-[#3B211B]/70 max-w-xl mx-auto">
              Tell us about your event, preferred flavors, and estimated batch size. Our pastry team will prepare a custom proposal and tasting box for you.
            </p>
          </div>

          {/* Direct WhatsApp Callout Banner */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F0F0C]">Prefer to chat on WhatsApp directly?</p>
                <p className="text-[11px] text-[#3B211B]/80">
                  Connect immediately with our head baker at <strong>+91 {whatsappNum}</strong> for instant custom batch quotes.
                </p>
              </div>
            </div>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp: {whatsappNum}</span>
            </a>
          </div>

          {submitted ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#F8F0E5] border-2 border-[#C47B55] text-center space-y-4 shadow-xl animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-gallery text-2xl font-bold text-[#3B211B]">
                Custom Order Inquiry Received!
              </h4>
              <p className="text-sm text-[#3B211B]/80 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{customerName}</strong>! Our head pastry chef will review your request for <strong>{eventType}</strong> and contact you within 24 business hours to finalize batch details and flavor curation.
              </p>

              <div className="p-4 bg-white rounded-2xl border border-[#E8D6C3] max-w-md mx-auto text-left text-xs space-y-1.5">
                <p><strong>Batch:</strong> {batchSize}</p>
                <p><strong>Selected Flavors ({selectedFlavors.length}):</strong> {selectedFlavors.join(', ') || 'Chef Choice'}</p>
                <p><strong>Contact:</strong> {customerEmail} &bull; {customerPhone}</p>
              </div>

              <div className="pt-3 flex flex-wrap justify-center gap-3">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Summary on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="px-6 py-2.5 rounded-full bg-[#3B211B] hover:bg-[#23120E] text-[#F8F0E5] font-bold text-xs transition-colors cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleCustomOrderSubmit}
              className="p-6 sm:p-10 rounded-3xl bg-[#F8F0E5]/60 border border-[#E8D6C3] shadow-md space-y-6"
            >
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Event Type & Batch Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2">
                    Event or Occasion Type *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    required
                  >
                    <option value="Wedding Favor & Dessert Table">Wedding Favors & Dessert Display</option>
                    <option value="Corporate Gifting & Gala">Corporate Gifting / Brand Celebration</option>
                    <option value="Birthday & Anniversary Party">Birthday & Private Anniversary</option>
                    <option value="Luxury Gift Box Hamper">Bespoke Gift Box Hamper</option>
                    <option value="Studio Private Tasting">Private Bakery Studio Tasting</option>
                    <option value="Other Custom Inquiry">Other Custom Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2">
                    Estimated Batch Size *
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E8D6C3] rounded-xl text-xs font-semibold text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    required
                  >
                    <option value="24 Artisan Pieces (Small Gathering)">24 Artisan Pieces (Small Gathering)</option>
                    <option value="50 Artisan Pieces (Medium Party)">50 Artisan Pieces (Medium Party)</option>
                    <option value="100+ Pieces (Grand Reception / Wedding)">100+ Pieces (Grand Reception / Wedding)</option>
                    <option value="250+ Pieces (Corporate Spread)">250+ Pieces (Corporate Spread)</option>
                    <option value="Custom Quantity to Discuss">Custom Quantity to Discuss</option>
                  </select>
                </div>
              </div>

              {/* Flavor Selection from the 10 Brownies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B]">
                    Selected Flavors ({selectedFlavors.length} of 10):
                  </label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllFlavors}
                      className="text-[11px] text-[#C47B55] hover:underline font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-[#3B211B]/40">&bull;</span>
                    <button
                      type="button"
                      onClick={clearAllFlavors}
                      className="text-[11px] text-[#3B211B]/60 hover:text-black font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Selected Flavor Chips */}
                {selectedFlavors.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-white rounded-2xl border border-[#E8D6C3]">
                    {selectedFlavors.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C47B55]/15 text-[#3B211B] border border-[#C47B55]/30 text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C47B55]" />
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={() => toggleFlavor(name)}
                          className="hover:text-red-700 ml-0.5 cursor-pointer"
                          title="Remove flavor"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-between">
                    <span>No flavors selected yet. Pick flavors below or we will curate chef favorites.</span>
                    <button
                      type="button"
                      onClick={selectAllFlavors}
                      className="text-xs font-bold text-[#C47B55] underline cursor-pointer"
                    >
                      Pick All
                    </button>
                  </div>
                )}

                {/* 10-Brownie Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {portfolioBrownies.map((b) => {
                    const isChecked = selectedFlavors.includes(b.name);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#C47B55]/10 border-[#C47B55] font-bold text-[#3B211B]'
                            : 'bg-white border-[#E8D6C3] text-[#3B211B]/80 hover:bg-white/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFlavor(b.name)}
                          className="accent-[#C47B55] w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="truncate">{b.name}</span>
                        <span className="text-[10px] text-[#C47B55] ml-auto shrink-0 font-mono">
                          {b.cocoaPercentage}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Event Date, Name, Phone, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C47B55]" />
                    Event or Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full p-3 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C47B55]" />
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C47B55]" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full p-3 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                    required
                  />
                </div>
              </div>

              {/* Special Requests / Dietary Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3B211B] mb-2">
                  Special Customization, Delivery Venue, or Dietary Requirements
                </label>
                <textarea
                  rows={3}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Need gluten-free batch, ribbon color in gold, deliver to Grand Ballroom at 2:00 PM..."
                  className="w-full p-3 bg-white border border-[#E8D6C3] rounded-xl text-xs text-[#3B211B] focus:outline-none focus:ring-2 focus:ring-[#C47B55]"
                />
              </div>

              {/* Submit CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#3B211B]/70">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No payment required now. Chef consultation & quote provided.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-5 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    title="Send via WhatsApp directly"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Quote</span>
                  </a>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white font-bold text-sm tracking-wide shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending Request...' : 'Submit Inquiry'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default CustomOrdersPage;
