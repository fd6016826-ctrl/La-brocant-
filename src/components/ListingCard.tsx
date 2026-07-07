import React from "react";
import { MapPin, Tag, Calendar, User, Eye, Heart, Sparkles } from "lucide-react";
import { Listing } from "../types";
import { Currency, formatPrice } from "../utils/currency";
import { motion } from "motion/react";

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  currency: Currency;
  isFavorited?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  onClick, 
  currency,
  isFavorited = false,
  onToggleFavorite
}) => {
  // Condition badges styled with soft, premium colors
  const getConditionStyle = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "neuf":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "comme neuf":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "excellent état":
      case "très bon état":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "bon état":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-warmGray-100 text-warmGray-700 border-warmGray-200";
    }
  };

  const formattedDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "Récemment";
    }
  };

  return (
    <motion.div
      id={`listing-card-${listing.id}`}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`relative flex flex-col h-full bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 ${
        listing.isSold ? "opacity-75" : ""
      } ${
        listing.isSponsored 
          ? "border-2 border-amber-400 dark:border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-2 ring-amber-300/10" 
          : "border border-stone-150/80"
      }`}
    >
      {/* Premium sponsor label banner wrapper on top */}
      {listing.isSponsored && (
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20 flex items-center gap-0.5 sm:gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-sans text-[7.5px] sm:text-[8.5px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded shadow-xs border border-amber-300/60">
          <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-current" />
          <span>PRO</span>
        </div>
      )}

      {/* Listing Image */}
      <div className="relative w-full h-32 sm:h-48 overflow-hidden bg-stone-50">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />

        {/* Favorite Heart Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className={`absolute top-2 sm:top-3 z-10 p-1 sm:p-1.5 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs text-stone-600 dark:text-stone-350 hover:text-rose-500 dark:hover:text-rose-400 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer border border-stone-100 dark:border-stone-800 ${
              listing.isSponsored ? "left-12 sm:left-14" : "left-2 sm:left-3"
            }`}
            title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${isFavorited ? "fill-rose-500 text-rose-500" : "text-stone-500 dark:text-stone-400"}`} />
          </button>
        )}
        
        {/* Transparent dark gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        {/* Price Badge */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-stone-900/95 backdrop-blur-xs text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10.5px] sm:text-sm font-bold tracking-wide font-mono shadow-xs">
          {formatPrice(listing.price, currency)}
        </div>

        {/* Condition Badge */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex gap-1.5 items-center">
          <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-md text-[9px] sm:text-xs font-semibold border ${getConditionStyle(listing.condition)}`}>
            {listing.condition}
          </span>
        </div>

        {/* Sold overlay */}
        {listing.isSold && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-650 text-white font-mono text-[10px] sm:text-sm tracking-widest font-bold uppercase px-2 py-1 sm:px-4 sm:py-1.5 rounded rotate-[-6deg] shadow-lg border border-white/20">
              Vendu
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-4 text-left">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-mono font-semibold text-stone-400 uppercase tracking-wider mb-0.5">
          <span>{listing.category}</span>
        </div>

        <h3 className="font-serif text-sm sm:text-lg font-bold text-stone-900 leading-snug line-clamp-1 mb-1 sm:mb-2">
          {listing.title}
        </h3>

        <p className="text-[10.5px] sm:text-xs text-stone-500 line-clamp-2 mb-2 sm:mb-4 leading-relaxed">
          {listing.description}
        </p>

        {/* Footer Meta */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-xs text-stone-500">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate max-w-[65px] sm:max-w-[110px]">{listing.location}</span>
          </div>
          <div className="flex items-center gap-1 text-stone-400 font-mono text-[9px] sm:text-[10px] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{formattedDate(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
