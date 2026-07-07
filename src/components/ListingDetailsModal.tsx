import React, { useState } from "react";
import { X, MapPin, Tag, Calendar, User, Phone, Mail, MessageSquare, Trash2, CheckCircle2, RotateCcw, Plus, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Listing } from "../types";
import { Currency, formatPrice } from "../utils/currency";
import { motion, AnimatePresence } from "motion/react";
import { getRatingForUser, getReviewsForUser } from "../utils/reviews";
import { getDescriptionStyleConfig } from "../utils/styleHelper";

interface ListingDetailsModalProps {
  listing: Listing;
  currentUserEmail: string;
  currentUserName: string;
  onClose: () => void;
  onToggleSold: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSendMessage: (listingId: string, text: string) => Promise<void>;
  onOpenLogin: () => void;
  currency: Currency;
  isDarkMode?: boolean;
  onConfirmPurchase?: (id: string) => Promise<void>;
  onConfirmSale?: (id: string) => Promise<void>;
  onContactSeller?: (listing: Listing, requestedQty: number) => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  listing,
  currentUserEmail,
  currentUserName,
  onClose,
  onToggleSold,
  onDelete,
  onSendMessage,
  onOpenLogin,
  currency,
  isDarkMode = false,
  onConfirmPurchase,
  onConfirmSale,
  onContactSeller,
}) => {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [revealPhone, setRevealPhone] = useState(false);
  const [mediaTab, setMediaTab] = useState<"image" | "video">("image");
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);

  const allImages = [listing.imageUrl, ...(listing.additionalImages || [])].filter(Boolean);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIdx, setLightboxImageIdx] = useState(0);

  const isOwner = currentUserEmail.toLowerCase().trim() === listing.sellerEmail.toLowerCase().trim();

  const handleConfirmPurchaseClick = async () => {
    if (onConfirmPurchase) {
      await onConfirmPurchase(listing.id);
      setShowConfirmPrompt(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(listing.id, messageText);
      setSendSuccess(true);
      setMessageText("");
      setTimeout(() => {
        setSendSuccess(false);
      }, 4000);
    } catch (err) {
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setIsSending(false);
    }
  };

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
        return "bg-[#faf9f6] text-stone-700 border-stone-200";
    }
  };

  const formattedDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date inconnue";
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden z-10 max-h-[92vh] md:max-h-[85vh] flex flex-col md:flex-row border transition-colors duration-300 ${isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-100 text-stone-900"}`}
      >
        {/* Left Column: Image Area / Video Area */}
        <div className={`md:w-1/2 relative min-h-[160px] sm:min-h-[240px] md:min-h-[300px] md:h-auto flex flex-col justify-between ${isDarkMode ? "bg-stone-950" : "bg-stone-900"}`}>
          {/* Main Media Viewer */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black min-h-[140px] sm:min-h-[200px] md:min-h-[250px]">
            {mediaTab === "image" ? (
              <div 
                className="relative w-full h-full cursor-zoom-in group/mainimg overflow-hidden flex items-center justify-center"
                onClick={() => {
                  setLightboxImageIdx(activeImageIdx);
                  setIsLightboxOpen(true);
                }}
                title="Cliquez pour agrandir la photo"
              >
                <img
                  src={allImages[activeImageIdx] || listing.imageUrl}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all max-h-[180px] sm:max-h-[240px] md:max-h-[455px] group-hover/mainimg:scale-[1.02]"
                />
                <div className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/85 text-white py-1.5 px-3 rounded-xl backdrop-blur-xs transition-colors flex items-center gap-1.5 text-[10px] font-bold z-10 shadow-md">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Agrandir</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full min-h-[140px] sm:min-h-[200px] md:min-h-[250px] bg-black flex items-center justify-center">
                <video
                  src={listing.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            )}
          </div>

          {/* Thumbnail row if there are multiple images */}
          {mediaTab === "image" && allImages.length > 1 && (
            <div className="p-2.5 flex gap-2 overflow-x-auto justify-start md:justify-center border-t border-white/10 bg-black/50 overflow-y-hidden select-none w-full scrollbar-none">
              {allImages.map((imgUrl, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImageIdx(index)}
                  className={`w-11 h-11 rounded-lg border transition-all overflow-hidden shrink-0 cursor-pointer ${
                    activeImageIdx === index
                      ? "border-amber-500 scale-105"
                      : "border-white/20 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${index + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {listing.isSold && (
            <div className="absolute inset-0 bg-stone-950/70 flex items-center justify-center z-10 pointer-events-none">
              <span className="bg-red-600 text-white font-mono text-base tracking-widest font-bold uppercase px-6 py-2 rounded-md rotate-[-6deg] shadow-lg border-2 border-white/20">
                Vendu
              </span>
            </div>
          )}

          {/* Floating Media Tab Switcher */}
          {listing.videoUrl && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex bg-stone-950/90 backdrop-blur-md p-1 rounded-full text-[11px] text-white z-20 border border-white/10 shadow-lg">
              <button
                type="button"
                onClick={() => setMediaTab("image")}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  mediaTab === "image" ? "bg-amber-600 text-white" : "text-stone-300 hover:text-white"
                }`}
              >
                Photo
              </button>
              <button
                type="button"
                id="view-media-video"
                onClick={() => setMediaTab("video")}
                className={`px-3 py-1 rounded-full font-medium flex items-center gap-1.5 transition-colors ${
                  mediaTab === "video" ? "bg-amber-600 text-white" : "text-stone-300 hover:text-white"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Vidéo démo
              </button>
            </div>
          )}

          {/* Close button on absolute for mobile layer */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 bg-white/95 p-2 rounded-full shadow-md hover:bg-white text-stone-700 z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right Column: Details & Actions */}
        <div className={`md:w-1/2 p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col min-h-0 transition-colors duration-300 ${isDarkMode ? "bg-stone-900" : "bg-white"}`}>
          {/* Header */}
          <div className="hidden md:flex justify-between items-start mb-4">
            <span className="text-xs font-mono font-medium text-stone-400 uppercase tracking-wider">
              {listing.category}
            </span>
            <button
              onClick={onClose}
              className={`transition-colors p-1 rounded-full ${isDarkMode ? "text-stone-450 hover:text-white hover:bg-stone-800" : "text-stone-450 hover:text-stone-700 hover:bg-stone-50"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title & Price */}
          <div className="mb-4">
            <h2 className={`font-serif text-2xl font-bold leading-tight mb-2 ${isDarkMode ? "text-white" : "text-stone-900"}`}>
              {listing.title}
            </h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-semibold text-amber-500">
                {formatPrice(listing.price, currency)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${getConditionStyle(listing.condition)}`}>
                {listing.condition}
              </span>
            </div>
          </div>

          {/* Specifications list (size, color, quantity) */}
          {(listing.size || listing.color || (listing.quantity && listing.quantity >= 1)) && (
            <div className={`grid grid-cols-3 gap-2 p-3 text-left mb-4 rounded-xl border text-xs transition-colors shadow-3xs ${
              isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-300" : "bg-stone-50/50 border-stone-150 text-stone-600"
            }`}>
              {listing.size ? (
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-mono text-stone-400 font-bold tracking-wider">Taille</span>
                  <span className={`font-medium block truncate ${isDarkMode ? "text-stone-200" : "text-stone-800"}`} title={listing.size}>{listing.size}</span>
                </div>
              ) : (
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-mono text-stone-400 font-bold tracking-wider">Taille</span>
                  <span className="text-stone-400 italic block truncate">---</span>
                </div>
              )}
              {listing.color ? (
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-mono text-stone-400 font-bold tracking-wider">Couleur</span>
                  <span className={`font-medium block truncate ${isDarkMode ? "text-stone-200" : "text-stone-800"}`} title={listing.color}>{listing.color}</span>
                </div>
              ) : (
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-mono text-stone-400 font-bold tracking-wider">Couleur</span>
                  <span className="text-stone-400 italic block truncate">---</span>
                </div>
              )}
              {listing.quantity !== undefined && (
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase font-mono text-stone-400 font-bold tracking-wider">Quantité</span>
                  <span className={`font-semibold block truncate ${listing.isSold || listing.quantity <= 0 ? "text-rose-500 font-bold animate-pulse" : isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                    {listing.isSold || listing.quantity <= 0 ? "0 (Épuisé / Vendu)" : listing.quantity}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-2">
              Description de l'article
            </h4>
            {(() => {
              const activeStyle = getDescriptionStyleConfig(listing.descriptionStyle, !!isDarkMode);
              return (
                <p 
                  className={`whitespace-pre-line leading-relaxed text-sm ${activeStyle.className}`}
                  style={activeStyle.style}
                >
                  {listing.description}
                </p>
              );
            })()}
          </div>

          {/* Meta Info list */}
          <div className={`grid grid-cols-2 gap-4 mb-6 text-xs border-b pb-5 ${isDarkMode ? "border-stone-800 text-stone-400" : "border-stone-100 text-stone-500"}`}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-stone-400" />
              <div>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">Localisation</p>
                <p className={`font-medium ${isDarkMode ? "text-stone-200" : "text-stone-700"}`}>{listing.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <div>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">Date de publication</p>
                <p className={`font-medium ${isDarkMode ? "text-stone-200" : "text-stone-700"}`}>{formattedDate(listing.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Seller Interactive Profile Section */}
          <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${isDarkMode ? "border-stone-800 bg-stone-950/40 text-stone-200" : "border-stone-150 bg-stone-50/60 text-stone-850"}`}>
            <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-2.5">
              À propos de l'annonceur
            </h4>
            <div 
              onClick={() => setShowSellerProfile(true)}
              className={`flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-stone-800/40" : "hover:bg-stone-100/50"}`}
              title="Voir le profil complet et les avis de l'annonceur"
            >
              <div className="w-10 h-10 rounded-full bg-[#fcd462] text-stone-950 flex items-center justify-center font-serif font-bold text-base uppercase shadow-xs group-hover:scale-105 transition-transform shrink-0">
                {listing.sellerName.substring(0, 1).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className={`font-serif font-bold text-sm transition-colors leading-none truncate ${isDarkMode ? "text-stone-100 group-hover:text-amber-400" : "text-stone-900 group-hover:text-amber-800"}`}>
                    {listing.sellerName}
                  </h5>
                  <div className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-0.5">
                    <span>⭐</span>
                    <span>{((listing.sellerEmail.length * 7) % 5 / 10 + 4.4).toFixed(1)}</span>
                  </div>
                </div>
                <p className={`text-[10px] font-mono mt-1 flex items-center gap-1 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                  <span>Membre actif</span>
                  <span>•</span>
                  <span className="underline group-hover:text-amber-500">Voir les avis vérifiés ({((listing.sellerEmail.length * 3) % 19 + 5)} retours)</span>
                </p>
              </div>
              
              <div className="text-[10px] text-amber-500 font-semibold group-hover:underline flex items-center gap-1">
                <span>Détails</span>
                <span className="text-stone-400">→</span>
              </div>
            </div>
          </div>

          {/* Owner details card / Buyer Form */}
          <div className="mt-auto space-y-3">
            {isOwner ? (
              // Actions container for OWNER
              <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-stone-200/40">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs uppercase">
                    Moi
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-stone-800">C'est votre annonce publique</h5>
                    <p className="text-[10px] text-stone-400 font-mono">Gérez la disponibilité et supprimez-la</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    onClick={() => onToggleSold(listing.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border shadow-xs transition-colors duration-200 ${
                      listing.isSold
                        ? "bg-stone-200 hover:bg-stone-300 text-stone-700 border-stone-300"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                    }`}
                  >
                    {listing.isSold ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Republier l'annonce
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Marquer comme Vendu
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Voulez-vous vraiment supprimer cette annonce ?")) {
                        onDelete(listing.id);
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (listing.isSold || (listing.quantity !== undefined && listing.quantity <= 0)) ? (
              // Block layout when stock is fully exhausted
              <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950 rounded-xl p-5 text-center space-y-4 shadow-sm">
                <div className="mx-auto w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-700 dark:text-rose-450 animate-pulse">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-stone-900 dark:text-white text-sm">
                    Stock Épuisé / Objet Vendu
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal max-w-xs mx-auto">
                    Toutes les quantités de cet article ont été vendues ! Cet objet n'est plus disponible pour l'achat direct ou la négociation.
                  </p>
                </div>
              </div>
            ) : !currentUserEmail ? (
              // Block contact for Guest Users (forcing account creation)
              <div className="bg-amber-50/65 border border-amber-200 rounded-xl p-5 text-center space-y-4 shadow-sm">
                <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <User className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Compte Requis pour Contacter
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-normal max-w-xs mx-auto">
                    Pour poser des questions à {listing.sellerName}, négocier ou organiser un échange, vous devez créer un compte sur La Brocante.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full bg-[#fcd462] hover:bg-[#ebd048] active:scale-99 text-stone-950 font-bold text-xs py-2.5 rounded-xl transition duration-200 shadow-3xs flex items-center justify-center gap-1.5 focus:outline-hidden cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer un compte ou s'identifier</span>
                </button>
              </div>
            ) : (
              // Contact area for BUYER with a "Contacter le vendeur" direct button
              <div className="space-y-2.5">
                <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-100 flex items-center justify-center font-serif font-bold text-xs uppercase">
                        {listing.sellerName.substring(0, 1)}
                      </div>
                      <div>
                        <h4 className="font-serif font-semibold text-stone-900 text-xs">
                          {listing.sellerName} (Vendeur)
                        </h4>
                        <p className="text-[10px] text-stone-400 font-mono">{listing.sellerEmail}</p>
                      </div>
                    </div>

                    {/* Phone Mask Button */}
                    {listing.sellerPhone && listing.sellerPhone !== "Non renseigné" && (
                      <button
                        type="button"
                        onClick={() => setRevealPhone(!revealPhone)}
                        className="text-stone-500 hover:text-stone-800 transition-colors p-1.5 rounded-lg border border-stone-100 bg-white shadow-3xs flex items-center gap-1 text-[11px]"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {revealPhone ? listing.sellerPhone : "Voir Tél"}
                      </button>
                    )}
                  </div>

                  {/* High Quality Quantity Selector with Stepper controls */}
                  <div className={`p-4 rounded-xl border mb-3.5 text-left transition-colors duration-200 ${
                    isDarkMode ? "bg-stone-900/40 border-stone-800 text-stone-300" : "bg-stone-50/70 border-stone-200 text-stone-800"
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-stone-500">
                        Quantité à acheter
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-650 dark:text-amber-400 font-bold border border-amber-500/15">
                        En stock : {listing.quantity !== undefined && listing.quantity >= 1 ? listing.quantity : 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <p className={`text-[11.2px] ${isDarkMode ? "text-stone-400" : "text-stone-500"} leading-snug max-w-[150px]`}>
                        Sélectionnez la quantité désirée avant de contacter.
                      </p>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-stone-950 p-1.5 rounded-xl border border-stone-250/20 shadow-3xs">
                        <button
                          type="button"
                          onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                          disabled={selectedQty <= 1}
                          className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm font-bold flex items-center justify-center transition-colors hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 dark:text-stone-200 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={listing.quantity !== undefined && listing.quantity >= 1 ? listing.quantity : 1}
                          value={selectedQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const maxVal = listing.quantity !== undefined && listing.quantity >= 1 ? listing.quantity : 1;
                            setSelectedQty(Math.max(1, Math.min(maxVal, val)));
                          }}
                          className="w-10 text-center text-xs font-mono font-bold bg-transparent dark:text-white focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const maxVal = listing.quantity !== undefined && listing.quantity >= 1 ? listing.quantity : 1;
                            setSelectedQty(Math.min(maxVal, selectedQty + 1));
                          }}
                          disabled={selectedQty >= (listing.quantity !== undefined && listing.quantity >= 1 ? listing.quantity : 1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm font-bold flex items-center justify-center transition-colors hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 dark:text-stone-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onContactSeller?.(listing, selectedQty)}
                    className="w-full bg-stone-900 hover:bg-stone-850 active:scale-99 text-white font-bold text-xs py-2.5 rounded-xl transition duration-200 shadow-3xs flex items-center justify-center gap-1.5 focus:outline-hidden cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contacter le vendeur</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>

    {/* Seller Profile Overlay Modal */}
    <AnimatePresence>
      {showSellerProfile && (
        <React.Fragment key="seller-profile-overlay">
          {/* Darker backdrop for profile modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSellerProfile(false)}
            className="fixed inset-0 bg-stone-950/80 z-60 cursor-pointer"
          />
          
          {/* Profile Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 max-w-md w-full rounded-2xl shadow-2xl border p-6 z-65 text-left flex flex-col focus:outline-hidden transition-colors duration-300 ${isDarkMode ? "bg-stone-900 border-stone-850 text-stone-100" : "bg-white border-stone-200 text-stone-900"}`}
          >
            {/* Header Close */}
            <div className={`flex items-center justify-between pb-3.5 border-b ${isDarkMode ? "border-stone-800" : "border-stone-150"}`}>
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-100 text-amber-950 border border-amber-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Certifié CITOYEN
                </span>
              </div>
              <button
                onClick={() => setShowSellerProfile(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${isDarkMode ? "text-stone-400 hover:text-white hover:bg-stone-800" : "text-stone-400 hover:text-stone-850 hover:bg-stone-100"}`}
                title="Fermer le profil"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile card core info */}
            <div className={`py-5 flex flex-col items-center text-center space-y-3 rounded-xl border p-4 mt-3 transition-colors ${isDarkMode ? "bg-stone-950/40 border-stone-850" : "bg-gradient-to-b from-stone-50 to-white border-stone-100"}`}>
              <div className="w-14 h-14 rounded-full bg-[#fcd462] text-stone-950 font-serif font-bold text-2xl flex items-center justify-center shadow-md">
                {listing.sellerName.substring(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className={`font-serif text-lg font-bold ${isDarkMode ? "text-stone-100" : "text-stone-900"}`}>{listing.sellerName}</h3>
                <p className="text-[11px] text-stone-450 font-mono mt-0.5">{listing.sellerEmail}</p>
              </div>
               {/* Note details */}
              {(() => {
                const { rating, count } = getRatingForUser(listing.sellerEmail);
                const sellerReviews = getReviewsForUser(listing.sellerEmail);

                return (
                  <>
                    <div className="flex items-center gap-3 pt-1">
                      <div className={`border rounded-xl px-3 py-1.5 text-center ${isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-amber-50 border-amber-200/50"}`}>
                        <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none">Note Globale</p>
                        <p className="font-mono text-base font-bold text-amber-500 mt-1">
                          ⭐ {rating} / 5
                        </p>
                      </div>
                      <div className={`border rounded-xl px-3 py-1.5 text-center ${isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/40"}`}>
                        <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none">Avis Reçus</p>
                        <p className={`font-mono text-base font-bold mt-1 ${isDarkMode ? "text-stone-100" : "text-stone-850"}`}>
                          {count} retours
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold">
                        ✓ Identité Validée
                      </span>
                      <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold">
                        👥 Membre Recommandé
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Reviews Section */}
            <div className="mt-5 space-y-3 overflow-y-auto max-h-[220px] pr-1">
              {(() => {
                const sellerReviews = getReviewsForUser(listing.sellerEmail);
                return (
                  <>
                    <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
                      Dernières évaluations ({Math.min(3, sellerReviews.length)} affichées)
                    </h4>
                    
                    <div className="space-y-2.5">
                      {sellerReviews.length === 0 ? (
                        <div className={`p-4 rounded-xl border border-dashed text-xs text-stone-400 text-center ${isDarkMode ? "border-stone-800" : "border-stone-200"}`}>
                          Aucune évaluation n'a encore été laissée pour ce vendeur.
                        </div>
                      ) : (
                        sellerReviews.slice(0, 3).map((r) => (
                          <div key={r.id} className={`p-2.5 rounded-xl border text-xs transition-colors ${isDarkMode ? "bg-stone-950/30 border-stone-850" : "bg-stone-50 border-stone-150"}`}>
                            <div className="flex justify-between items-baseline mb-1">
                              <span className={`font-semibold ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>{r.senderName}</span>
                              <span className="text-[9px] text-stone-400 font-mono font-medium">{r.date}</span>
                            </div>
                            <div className="text-amber-500 text-[10px] mb-1 font-mono">
                              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} ({r.rating.toFixed(1)})
                            </div>
                            <p className={`font-medium italic ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                              "{r.text}"
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <button
              onClick={() => setShowSellerProfile(false)}
              className={`mt-5 w-full font-semibold text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer text-center ${
                isDarkMode 
                  ? "bg-amber-600 hover:bg-amber-700 text-white" 
                  : "bg-stone-900 hover:bg-stone-800 text-white"
              }`}
            >
              Retour à l'annonce
            </button>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>

    {/* Lightbox / Full-screen Image Viewer */}
    <AnimatePresence>
      {isLightboxOpen && (
        <div className="fixed inset-0 z-55 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setIsLightboxOpen(false)} />
          
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-55 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
            title="Fermer la vue agrandie"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Left Button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-55 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              title="Image précédente"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Navigation Right Button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImageIdx((prev) => (prev + 1) % allImages.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-55 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              title="Image suivante"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Large Image Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-4xl max-h-[75vh] w-full flex items-center justify-center z-50 pointer-events-none"
          >
            <img
              src={allImages[lightboxImageIdx]}
              alt={`Agrandie ${lightboxImageIdx + 1}`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
            />
          </motion.div>

          {/* Image Indicator Counter */}
          <div className="absolute bottom-24 text-white/60 font-mono text-xs z-50">
            {lightboxImageIdx + 1} / {allImages.length}
          </div>

          {/* Lightbox Thumbnails Indicator List */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 max-w-[90vw] overflow-x-auto px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl z-50 select-none scrollbar-none justify-start sm:justify-center">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImageIdx(idx);
                  }}
                  className={`w-12 h-12 rounded-xl border-2 transition-all overflow-hidden shrink-0 cursor-pointer ${
                    lightboxImageIdx === idx
                      ? "border-amber-400 scale-105"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail Lightbox ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  </>
);
};
