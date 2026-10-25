import React from 'react';
import { Cake, Heart, Instagram, MessageCircle, Mail, Phone } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { getInstagramUrl } from '../utils/formatters';

interface FooterProps {
  onOpenCreations: () => void;
  onOpenClasses: () => void;
  onOpenContact: () => void;
  onOpenCustomOrders?: () => void;
  onOpenMyActivity?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCreations,
  onOpenClasses,
  onOpenContact,
  onOpenCustomOrders,
  onOpenMyActivity,
}) => {
  const { settings } = useContent();

  return (
    <footer className="bg-[#23120E] text-[#E8D6C3] pt-16 pb-12 border-t border-[#3B211B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#3B211B]/80">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C47B55] flex items-center justify-center text-white shadow-md">
                <Cake className="w-5 h-5 text-[#F8F0E5]" />
              </div>
              <span className="font-brand text-2xl font-bold tracking-wider text-[#F8F0E5]">
                BrowineGirlCakes
              </span>
            </div>
            <p className="text-xs text-[#E8D6C3]/80 leading-relaxed">
              Discover the pure joy of homemade artisan brownies, baked with single-origin cocoa, French butter, and deep passion in every batch.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[#C47B55]">
              <a
                href={getInstagramUrl(settings.instagramId)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#3B211B] flex items-center justify-center hover:bg-[#C47B55] hover:text-white transition-colors"
                aria-label="Official Instagram @browniegirlcakes"
                title="Follow @browniegirlcakes on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/91${(settings.whatsappNumber || '7339651529').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello BrowineGirlCakes! I would like to inquire about a custom order.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#3B211B] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors"
                aria-label="WhatsApp Inquiry"
                title={`WhatsApp Inquiry: ${settings.whatsappNumber || '7339651529'}`}
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
              </a>
              <a
                href={`mailto:${settings.email}`}
                className="w-8 h-8 rounded-full bg-[#3B211B] flex items-center justify-center hover:bg-[#C47B55] hover:text-white transition-colors"
                aria-label="Email"
                title={settings.email}
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-footer text-sm font-semibold tracking-wider uppercase text-[#F8F0E5] mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E8D6C3]/80">
              <li>
                <button onClick={onOpenCreations} className="hover:text-[#C47B55] transition-colors cursor-pointer">
                  Five Signature Brownies
                </button>
              </li>
              <li>
                <button onClick={onOpenClasses} className="hover:text-[#C47B55] transition-colors cursor-pointer">
                  Baking Masterclasses
                </button>
              </li>
              <li>
                <a href="#about-section" className="hover:text-[#C47B55] transition-colors">
                  The Baker Behind the Brand
                </a>
              </li>
              <li>
                <button onClick={onOpenCustomOrders || onOpenContact} className="hover:text-[#C47B55] text-[#E5A962] font-semibold transition-colors cursor-pointer">
                  Custom Orders & Catering
                </button>
              </li>
            </ul>
          </div>

          {/* Studio Hours */}
          {/*<div>
            <h4 className="font-footer text-sm font-semibold tracking-wider uppercase text-[#F8F0E5] mb-4">
              Studio & Bakery Hours
            </h4>
            <div className="space-y-2 text-xs text-[#E8D6C3]/80">
              <p><strong className="text-[#F8F0E5]">Mon – Fri:</strong> 8:00 AM – 6:30 PM</p>
              <p><strong className="text-[#F8F0E5]">Saturday:</strong> 9:00 AM – 5:00 PM</p>
              <p><strong className="text-[#F8F0E5]">Sunday:</strong> 10:00 AM – 4:00 PM</p>
              <p className="pt-2 text-[11px] text-[#C47B55]">Baking classes run on weekend schedules</p>
            </div>
          </div>
          */}

          {/* Contact & Inquiries */}
          <div>
            <h4 className="font-footer text-sm font-semibold tracking-wider uppercase text-[#F8F0E5] mb-4">
              Direct Contact & Orders
            </h4>
            <div className="space-y-3 text-xs text-[#E8D6C3]/80">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href={`https://wa.me/91${(settings.whatsappNumber || '7339651529').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello BrowineGirlCakes! I would like to inquire about a custom order.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#25D366] transition-colors"
                >
                  WhatsApp: +91 {settings.whatsappNumber || '7339651529'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C47B55] shrink-0" />
                <a
                  href={`tel:${settings.phoneRaw || '+15553922253'}`}
                  className="hover:text-[#E5A962] transition-colors"
                >
                  {settings.phone} <span className="text-[#E8D6C3]/60">({settings.phoneRaw})</span>
                </a>
              </div>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C47B55] shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-[#E5A962] transition-colors">
                  {settings.email}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E8D6C3]/60 gap-4">
          <p>© {new Date().getFullYear()} BrowineGirlCakes. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="#admin"
              className="opacity-0 hover:opacity-40 transition-opacity text-[10px] cursor-default"
              title="Portal"
            >
              •
            </a>
            <p className="flex items-center gap-1">
              Handcrafted with <Heart className="w-3.5 h-3.5 text-[#C47B55] fill-[#C47B55]" /> by BrowineGirlCakes.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
