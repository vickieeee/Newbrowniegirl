import React from 'react';
import { SIGNATURE_BROWNIES, BrownieItem } from '../data/brownies';
import { X, Heart, Star, Sparkles, Check, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { formatRupee } from '../utils/formatters';

interface CreationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBrownie?: BrownieItem | null;
  onSelectBrownie: (brownie: BrownieItem) => void;
  onOrderNow: () => void;
  onOpenCustomOrders?: () => void;
}

export const CreationsDrawer: React.FC<CreationsDrawerProps> = ({
  isOpen,
  onClose,
  selectedBrownie,
  onSelectBrownie,
  onOrderNow,
  onOpenCustomOrders,
}) => {
  const { userProfile, toggleFavorite, user, signInWithGoogle } = useAuth();
  const { menuItems } = useContent();
  const brownies = menuItems.length > 0 ? menuItems : SIGNATURE_BROWNIES;

  if (!isOpen) return null;

  const activeBrownie = selectedBrownie || brownies[0];
  const isFav = userProfile?.favorites?.includes(activeBrownie.id);

  const handleFavorite = async () => {
    if (!user) {
      const signedInUser = await signInWithGoogle();
      if (!signedInUser) return;
    }
    await toggleFavorite(activeBrownie.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#F8F0E5] h-full shadow-2xl flex flex-col border-l border-[#C47B55]/30 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#3B211B] text-[#F8F0E5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#E5A962]" />
            <div>
              <h3 className="font-gallery text-xl font-bold tracking-tight">Artisan Brownie Creations</h3>
              <p className="text-xs text-[#E8D6C3]/80">Slow-baked in small batches daily</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#F8F0E5] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Featured Brownie Spotlight */}
          <div className="bg-white rounded-2xl overflow-hidden border border-[#E8D6C3] shadow-md">
            <div className="relative h-64 sm:h-72 w-full bg-[#23120E]">
              <img
                src={activeBrownie.image}
                alt={activeBrownie.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <button
                onClick={handleFavorite}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#3B211B] flex items-center justify-center shadow-md transition-transform active:scale-90"
                aria-label="Favorite this brownie"
              >
                <Heart
                  className={`w-5 h-5 ${isFav ? 'text-red-500 fill-red-500' : 'text-[#3B211B]'}`}
                />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#E5A962] tracking-wider uppercase">
                    {activeBrownie.cocoaPercentage}
                  </span>
                  <h4 className="font-gallery text-2xl font-bold text-white drop-shadow-xs">
                    {activeBrownie.name}
                  </h4>
                </div>
                <span className="text-xs font-semibold text-white bg-[#C47B55] px-3.5 py-1 rounded-full shadow-xs tracking-wide">
                  Small-Batch
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-[#3B211B]/85 leading-relaxed">
                {activeBrownie.description}
              </p>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#C47B55] block mb-2">
                  Tasting & Flavor Notes
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeBrownie.flavorNotes.map((note, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8D6C3]/60 text-[#3B211B] text-xs font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-[#C47B55]" />
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F8F0E5] flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenCustomOrders) {
                      onOpenCustomOrders();
                    } else {
                      onOrderNow();
                    }
                  }}
                  className="flex-1 py-3 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-[#F8F0E5] font-semibold text-sm tracking-wide shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#E5A962]" />
                  Inquire for Custom Order
                </button>
              </div>
            </div>
          </div>

          {/* Quick Selector */}
          <div>
            <h4 className="font-gallery text-lg font-bold text-[#3B211B] mb-3">
              Browse Other Flavors
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {brownies.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectBrownie(b)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    activeBrownie.id === b.id
                      ? 'border-[#C47B55] bg-white shadow-sm'
                      : 'border-[#E8D6C3] bg-white/60 hover:bg-white'
                  }`}
                >
                  <img
                    src={b.image}
                    alt={b.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#3B211B] truncate">{b.name}</p>
                    <p className="text-[11px] text-[#C47B55] font-medium">{b.cocoaPercentage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
