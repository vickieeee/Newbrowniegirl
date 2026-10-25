import React from 'react';
import { InfiniteSlider } from '@/components/core/infinite-slider';
import { SIGNATURE_BROWNIES, BrownieItem } from '../data/brownies';
import { useContent } from '../context/ContentContext';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface BrownieGalleryProps {
  onSelectBrownie?: (brownie: BrownieItem) => void;
  onViewAllCreations?: () => void;
  onOpenCustomOrders?: () => void;
}

export function ProgressiveBlurSlider({
  onSelectBrownie,
  onOpenCustomOrders,
}: ProgressiveBlurSliderProps = {}) {
  const { menuItems } = useContent();
  const brownies = menuItems && menuItems.length > 0 ? menuItems : SIGNATURE_BROWNIES;
  const { userProfile, toggleFavorite, user, signInWithGoogle } = useAuth();

  const handleFavoriteClick = async (e: React.MouseEvent, brownieId: string) => {
    e.stopPropagation();
    if (!user) {
      const signedInUser = await signInWithGoogle();
      if (!signedInUser) return;
    }
    await toggleFavorite(brownieId);
  };

  return (
    <div className='relative h-[370px] w-full overflow-hidden'>
      <InfiniteSlider
        className='flex h-full w-full items-center'
        gap={24}
        speed={40}
        pauseOnHover={true}
        pauseOnTouch={true}
      >
        {brownies.map((brownie, idx) => {
          const isFav = userProfile?.favorites?.includes(brownie.id);
          const itemNum = idx + 1;

          return (
            <div
              key={brownie.id || idx}
              onClick={() => {
                if (onSelectBrownie) onSelectBrownie(brownie);
                else if (onOpenCustomOrders) onOpenCustomOrders();
              }}
              className='group relative flex h-[310px] w-[270px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 bg-[#23120E] p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#C47B55] hover:shadow-2xl dark:border-zinc-800 cursor-pointer'
            >
              {/* Background Photo */}
              <img
                src={brownie.image}
                alt={brownie.name}
                className='absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-[#1A0B08]/95 via-[#1A0B08]/45 to-black/30' />

              {/* Top Tag & Heart */}
              <div className='relative z-10 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/85 text-xs font-mono font-bold text-[#E5A962] border border-[#C47B55]/40 shadow-xs backdrop-blur-xs'>
                    {itemNum}
                  </span>
                  {brownie.badge && (
                    <span className='rounded-full bg-[#C47B55] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs'>
                      {brownie.badge}
                    </span>
                  )}
                </div>

                <button
                  type='button'
                  onClick={(e) => handleFavoriteClick(e, brownie.id)}
                  className='flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-transform active:scale-90 hover:bg-black/90'
                  aria-label='Toggle favorite'
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      isFav ? 'fill-red-500 text-red-500' : 'text-white'
                    }`}
                  />
                </button>
              </div>

              {/* Bottom Information (NO PRICE, NO ORDERING BUTTON) */}
              <div className='relative z-10 space-y-1.5'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-[#E5A962]'>
                  {brownie.cocoaPercentage}
                </p>

                <h3 className='font-gallery text-lg font-bold text-white drop-shadow-xs line-clamp-1 group-hover:text-[#E5A962] transition-colors'>
                  {brownie.name}
                </h3>

                <p className='line-clamp-2 text-xs text-[#E8D6C3]/80 leading-relaxed'>
                  {brownie.description}
                </p>

                <div className='pt-2 flex items-center justify-between border-t border-white/10 text-xs'>
                  <div className='flex items-center gap-1 text-[11px] text-[#E8D6C3]/70 truncate max-w-[150px]'>
                    <Sparkles className='h-3 w-3 text-[#E5A962] shrink-0' />
                    <span className='truncate'>{brownie.flavorNotes?.[0] || 'Artisan Recipe'}</span>
                  </div>
                  <span className='text-[11px] font-semibold text-[#E5A962] group-hover:underline flex items-center gap-1'>
                    Custom Order <ArrowRight className='h-3 w-3' />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </InfiniteSlider>
    </div>
  );
}

export interface ProgressiveBlurSliderProps {
  onSelectBrownie?: (brownie: BrownieItem) => void;
  onOpenCustomOrders?: () => void;
}

export const BrownieGallery: React.FC<BrownieGalleryProps> = ({
  onSelectBrownie,
  onViewAllCreations,
  onOpenCustomOrders,
}) => {
  return (
    <section className="w-full py-16 sm:py-20 bg-[#F8F0E5] border-b border-[#E8D6C3]" id="brownie-gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8D6C3] text-[#3B211B] text-xs font-semibold tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C47B55]" />
              Artisan Batch Portfolio
            </div>
            <h2 className="font-gallery text-3xl sm:text-4xl font-bold text-[#3B211B] tracking-tight">
              Our Artisan Brownie Menu
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#3B211B]/75 max-w-2xl">
              Slow-baked in small batches using pure Valrhona and Belgian chocolate, cultured butter, and delicate infusions. We specialize exclusively in custom orders and bespoke catering batches.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCustomOrders || onViewAllCreations}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C47B55] hover:bg-[#D98B5F] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <span>Explore Custom Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Infinite Slider with Progressive Blur */}
        <div className="py-2">
          <ProgressiveBlurSlider
            onSelectBrownie={onSelectBrownie}
            onOpenCustomOrders={onOpenCustomOrders}
          />
        </div>

        {/* Custom Order Callout Bar */}
        <div className="mt-8 p-6 rounded-3xl bg-[#23120E] text-[#F8F0E5] border border-[#3B211B] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-gallery text-lg font-bold text-[#F8F0E5]">
              Looking for a custom batch for an upcoming celebration?
            </h4>
            <p className="text-xs text-[#E8D6C3]/80">
              We handcraft custom dessert tables, personalized gift boxes, wedding favors, and corporate event brownie spreads.
            </p>
          </div>

          <button
            onClick={onOpenCustomOrders || onViewAllCreations}
            className="px-6 py-2.5 rounded-full bg-[#E5A962] hover:bg-[#F3BC7D] text-[#23120E] font-bold text-xs shadow-md transition-colors shrink-0 cursor-pointer"
          >
            Design Custom Order
          </button>
        </div>
      </div>
    </section>
  );
};

export default BrownieGallery;
