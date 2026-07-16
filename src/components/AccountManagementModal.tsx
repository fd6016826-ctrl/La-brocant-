import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User, 
  Check, 
  Plus, 
  Coins, 
  LogOut, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Star, 
  ShoppingBag, 
  TrendingUp,
  Globe,
  Heart,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Trash2,
  Clock,
  ShieldAlert,
  Send,
  Sparkles,
  Search,
  ChevronRight,
  Info,
  MapPin,
  HelpCircle,
  Truck,
  Crown,
  Pencil,
  Settings,
  Lock,
  Users
} from "lucide-react";
import { CURRENCIES, Currency, formatPrice } from "../utils/currency";
import { Listing } from "../types";
import { getRatingForUser, getReviewsForUser } from "../utils/reviews";
import { ProBadge } from "./ProBadge";

interface ChatThreadBasic {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImageUrl: string;
  sellerEmail: string;
  sellerName: string;
  buyerEmail: string;
  buyerName: string;
  lastMessageAt: string;
  messages: { id: string; senderEmail: string; senderName: string; text: string; createdAt: string; isRead?: boolean }[];
  requestedQuantity?: number;
  listingBuyerConfirmed?: boolean;
  listingSellerConfirmed?: boolean;
  listingIsSold?: boolean;
}

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserName: string;
  currentUserAvatar: string;
  setCurrentUserEmail: (email: string) => void;
  setCurrentUserName: (name: string) => void;
  setCurrentUserAvatar: (avatar: string) => void;
  simulatedAccounts: { email: string; name: string; avatar: string }[];
  setSimulatedAccounts: React.Dispatch<React.SetStateAction<{ email: string; name: string; avatar: string }[]>>;
  selectedCurrency: Currency;
  setSelectedCurrency: (curr: Currency) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  listings: Listing[];
  threads?: ChatThreadBasic[];
  onOpenLogin: () => void;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  onRefreshListings?: () => void;
  isProUser?: boolean;
  onOpenUpgradeModal?: () => void;
  prefRoundedPrices?: boolean;
  prefNotifEmail?: boolean;
  prefNotifAnnouncements?: boolean;
  prefAutoGeo?: boolean;
  prefVipBadge?: boolean;
  setPrefRoundedPrices?: (val: boolean) => void;
  setPrefNotifEmail?: (val: boolean) => void;
  setPrefNotifAnnouncements?: (val: boolean) => void;
  setPrefAutoGeo?: (val: boolean) => void;
  setPrefVipBadge?: (val: boolean) => void;
}

type ModalSubTab = "orders" | "favorites" | "reviews" | "security" | "support";

const DEFAULT_AVATAR_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231e293b'/><stop offset='100%' stop-color='%230f172a'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='42' r='16' fill='%23fbbf24'/><path d='M22,80 C22,64 32,56 50,56 C68,56 78,64 78,80' fill='%23fbbf24'/></svg>";

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserName,
  currentUserAvatar,
  setCurrentUserEmail,
  setCurrentUserName,
  setCurrentUserAvatar,
  simulatedAccounts,
  setSimulatedAccounts,
  selectedCurrency,
  setSelectedCurrency,
  isDarkMode,
  setIsDarkMode,
  listings,
  threads = [],
  onOpenLogin,
  favorites,
  setFavorites,
  onRefreshListings,
  isProUser = false,
  onOpenUpgradeModal,
  prefRoundedPrices = false,
  prefNotifEmail = true,
  prefNotifAnnouncements = true,
  prefAutoGeo = true,
  prefVipBadge = false,
  setPrefRoundedPrices = () => {},
  setPrefNotifEmail = () => {},
  setPrefNotifAnnouncements = () => {},
  setPrefAutoGeo = () => {},
  setPrefVipBadge = () => {}
}) => {
  // Navigation tab state
  const [subTab, setSubTab] = useState<ModalSubTab>("orders");
  const [showAvatarChooser, setShowAvatarChooser] = useState(false);

  // Load listings whenever the modal is opened
  useEffect(() => {
    if (isOpen && onRefreshListings) {
      onRefreshListings();
    }
  }, [isOpen, onRefreshListings]);

  // Account creation states
  const [newAccName, setNewAccName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccAvatar, setNewAccAvatar] = useState(DEFAULT_AVATAR_PLACEHOLDER);
  const [showAddForm, setShowAddForm] = useState(false);

  // Support Ticketing State
  const [tickets, setTickets] = useState<{ id: string; subject: string; message: string; date: string; status: string; answer?: string }[]>(() => {
    try {
      const stored = localStorage.getItem("brocante_tickets");
      return stored ? JSON.parse(stored) : [
        {
          id: "TK-7841",
          subject: "Problème d'impression de justificatif",
          message: "Bonjour, je cherche comment visualiser ma facture de transaction après avoir validé un achat en personne.",
          date: "14/06/2026",
          status: "Résolu",
          answer: "Bonjour ! Nous avons mis en place une édition instantanée au format ticket de caisse imprimable directement depuis l'onglet Commandes. L'équipe Support."
        }
      ];
    } catch {
      return [];
    }
  });

  const [supportSubject, setSupportSubject] = useState("Question générale");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingTicket, setIsSendingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem("brocante_tickets", JSON.stringify(tickets));
  }, [tickets]);

  // Reviews Left State
  const [reviewsLeft, setReviewsLeft] = useState<{ id: string; targetEmail: string; targetName: string; rating: number; text: string; date: string }[]>(() => {
    try {
      const stored = localStorage.getItem("brocante_user_reviews_left");
      return stored ? JSON.parse(stored) : [
        {
          id: "rev-1",
          targetEmail: "sophie.b69@gmail.com",
          targetName: "Sophie B.",
          rating: 5,
          text: "Achat négocié très rapidement, l'objet correspond parfaitement et l'échange a été super constructif !",
          date: "12/06/2026"
        }
      ];
    } catch {
      return [];
    }
  });

  const [reviewOrderId, setReviewOrderId] = useState("");
  const [reviewTargetEmail, setReviewTargetEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(0); // 0 by default so no stars are annotated
  const [reviewText, setReviewText] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem("brocante_user_reviews_left", JSON.stringify(reviewsLeft));
  }, [reviewsLeft]);

  // Account Closure State
  const [confirmCloseInput, setConfirmCloseInput] = useState("");
  const [isCloseSuccess, setIsCloseSuccess] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Selected Billing Detail State (Simulated printable ticket modal)
  const [selectedReceiptListing, setSelectedReceiptListing] = useState<Listing | null>(null);

  const getAvatarPhoto = (av: string) => {
    if (av && (av.startsWith("http") || av.startsWith("data:"))) {
      return av;
    }
    return DEFAULT_AVATAR_PLACEHOLDER;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewAccAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  // Filter listings for active stats
  const activeListings = listings.filter(
    (l) => l.sellerEmail.toLowerCase() === currentUserEmail.toLowerCase() && !l.isSold
  );
  const activeListingsCount = activeListings.length;
  
  const soldListings = listings.filter(
    (l) => l.sellerEmail.toLowerCase() === currentUserEmail.toLowerCase() && l.isSold
  );
  const soldListingsCount = soldListings.length;

  const { rating: reliabilityRating, count: reviewsCount } = getRatingForUser(currentUserEmail);

  // Track user orders (My Purchases where listing.buyerEmail matches active user email)
  const confirmedPurchases = listings.filter(
    (l) => l.buyerEmail?.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()
  );

  // Also include active chat threads where user is buyer (negotiations in progress)
  // These are threads where the listing hasn't been sold/confirmed yet
  const activeBuyerThreads = threads.filter((t) => {
    const isBuyer = t.buyerEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
    // Skip if already in confirmedPurchases
    const alreadyConfirmed = confirmedPurchases.some((p) => p.id === t.listingId);
    // Skip demand threads
    const isDemand = t.listingId.startsWith("demand_ref_");
    return isBuyer && !alreadyConfirmed && !isDemand;
  });

  // Convert threads to a Listing-like shape for display
  const pendingPurchasesFromChats: Listing[] = activeBuyerThreads.map((t) => {
    const realListing = listings.find((l) => l.id === t.listingId);
    return {
      id: t.listingId,
      title: t.listingTitle,
      price: t.listingPrice,
      imageUrl: t.listingImageUrl,
      sellerEmail: t.sellerEmail,
      sellerName: t.sellerName,
      sellerPhone: "",
      category: realListing?.category || "—",
      location: realListing?.location || "—",
      condition: realListing?.condition || "—",
      description: realListing?.description || "",
      createdAt: t.lastMessageAt,
      isSold: false,
      buyerEmail: t.buyerEmail,
      buyerName: t.buyerName,
      buyerConfirmed: false,
      sellerConfirmed: false,
      requestedQuantity: t.requestedQuantity || 1,
    };
  });

  // Merge: confirmed purchases first, then pending negotiations (no duplicates)
  const myPurchases = [
    ...confirmedPurchases,
    ...pendingPurchasesFromChats.filter(
      (p) => !confirmedPurchases.some((c) => c.id === p.id)
    ),
  ];

  // Track user sales (all listings by this seller, including active and sold)
  const allMySales = listings.filter(
    (l) => l.sellerEmail.toLowerCase() === currentUserEmail.toLowerCase()
  );

  // Pre-select the last order placed when opening reviews
  useEffect(() => {
    if (subTab === "reviews" && myPurchases.length > 0) {
      const lastPurchase = myPurchases[myPurchases.length - 1];
      if (lastPurchase) {
        setReviewOrderId(lastPurchase.id);
        setReviewTargetEmail(lastPurchase.sellerEmail);
      }
    }
  }, [subTab, myPurchases.length]);

  // Track interesting products (Favoris)
  const favoritedListings = listings.filter(
    (l) => favorites.includes(l.id)
  );

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmail.trim() || !newAccEmail.includes("@")) {
      alert("Veuillez saisir un nom et un email valides.");
      return;
    }

    const emailLower = newAccEmail.toLowerCase().trim();
    const exists = simulatedAccounts.some(a => a.email.toLowerCase() === emailLower);
    if (exists) {
      alert("Cet email est déjà enregistré !");
      return;
    }

    const newAcc = {
      email: emailLower,
      name: newAccName.trim(),
      avatar: newAccAvatar
    };

    setSimulatedAccounts(prev => [...prev, newAcc]);
    setCurrentUserEmail(newAcc.email);
    setCurrentUserName(newAcc.name);
    setCurrentUserAvatar(newAcc.avatar);

    setNewAccName("");
    setNewAccEmail("");
    setShowAddForm(false);
  };

  const handleSwitchProfile = (email: string) => {
    const acc = simulatedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (acc) {
      setCurrentUserEmail(acc.email);
      setCurrentUserName(acc.name);
      setCurrentUserAvatar(acc.avatar);
    } else {
      const rawName = email.split("@")[0];
      const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      setCurrentUserEmail(email);
      setCurrentUserName(capitalizedName);
      setCurrentUserAvatar(DEFAULT_AVATAR_PLACEHOLDER);
    }
  };

  // Submit support ticket
  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setIsSendingTicket(true);
    setTimeout(() => {
      const newTicket = {
        id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: supportSubject,
        message: supportMessage.trim(),
        date: new Date().toLocaleDateString("fr-FR"),
        status: "En cours",
        answer: "Merci pour votre message ! Un membre de l'équipe Brocante vient d'être notifié de votre problème. Nous reviendrons vers vous d'ici 24h avec une solution claire."
      };
      setTickets(prev => [newTicket, ...prev]);
      setSupportMessage("");
      setIsSendingTicket(false);
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 5000);
    }, 1200);
  };

  // Submit a feedback review
  const handleSendReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTargetEmail || !reviewText.trim()) {
      alert("Veuillez renseigner tous les champs requis.");
      return;
    }

    if (reviewRating === 0) {
      alert("Veuillez attribuer une note étoilée (au moins 1 étoile) pour soumettre votre avis.");
      return;
    }

    // Find custom sellerName from myPurchases if available
    const order = myPurchases.find(o => o.id === reviewOrderId);
    const targetName = order ? order.sellerName : (reviewTargetEmail.split("@")[0]);

    const newRev = {
      id: `rev-${Date.now()}`,
      targetEmail: reviewTargetEmail,
      targetName: targetName,
      rating: reviewRating,
      text: reviewText.trim(),
      date: new Date().toLocaleDateString("fr-FR")
    };

    setReviewsLeft(prev => [newRev, ...prev]);
    setReviewText("");
    setReviewRating(0); // Reset stars to 0 by default (no stars annotated by default)
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 4000);
  };

  // Close Account Handler
  const handleCloseAccount = () => {
    if (confirmCloseInput.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim()) {
      alert("L'adresse email saisie ne correspond pas.");
      return;
    }

    setIsCloseSuccess(true);
    setTimeout(() => {
      // Unlink current user credentials and return to guest mode
      setCurrentUserEmail("");
      setCurrentUserName("");
      setCurrentUserAvatar(DEFAULT_AVATAR_PLACEHOLDER);
      
      // Filter out this account from the simulated accounts so it's truly deleted!
      setSimulatedAccounts(prev => prev.filter(acc => acc.email.toLowerCase() !== confirmCloseInput.toLowerCase().trim()));

      setIsCloseSuccess(false);
      setShowCloseModal(false);
      setConfirmCloseInput("");
      onClose();
    }, 1500);
  };

  // Dynamic confirmation of purchase from within parameters list
  const handleConfirmOrderDelivery = async (id: string, isBuyer: boolean) => {
    try {
      const endpoint = isBuyer ? `/api/listings/${id}/purchase` : `/api/listings/${id}/sell`;
      const body = isBuyer ? { buyerEmail: currentUserEmail, buyerName: currentUserName } : {};
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert("Transaction mise à jour et validée avec succès !");
        // Reload page or let parent component trigger fetch listings
        if (onRefreshListings) {
          onRefreshListings();
        } else {
          window.location.reload();
        }
      } else {
        alert("Erreur lors de la mise à jour de la transaction.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  // Pre-generate mock reviews received for visual feedback with persistence
  const mockReviewsReceived = currentUserEmail ? getReviewsForUser(currentUserEmail) : [];

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs cursor-pointer"
      />

      {/* Modal Container - Expanded Full Page/Window Style */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        className="relative bg-[#faf9f6] dark:bg-stone-900 rounded-[28px] shadow-2xl border border-stone-200/85 dark:border-stone-800 w-full max-w-5xl md:w-[95vw] w-[98vw] overflow-hidden flex flex-col md:flex-row h-[94vh] text-stone-900 dark:text-stone-100 font-sans"
        id="account-management-modal"
      >
        {/* Left Sidebar - Reorganized Navigation & Header */}
        <div className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-stone-200/60 dark:border-stone-800 bg-[#faf9f6] dark:bg-stone-900 md:w-80 w-full shrink-0 flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#f5a623]" />
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-sans tracking-tight">
                Paramètres & Mon Espace
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-full transition text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs sm:text-[13px] text-stone-600 dark:text-stone-400 leading-normal text-left font-medium">
            Gérez vos favoris, visualisez l'historique de vos commandes, ajustez vos préférences ou contactez le support.
          </p>

          {/* Reorganized Tab Deck - Beautiful Grid on mobile, solid Sidebar List on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 pt-1.5">
            {[
              { id: "orders", label: "Commandes", count: (myPurchases.length + allMySales.length) || 1, icon: <ShoppingBag className="w-4 h-4" /> },
              { id: "favorites", label: "Favoris", count: favorites.length || 3, icon: <Heart className="w-4 h-4 text-red-500 fill-red-500" /> },
              { id: "reviews", label: "Avis", icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> },
              { id: "security", label: "Sécurité", icon: <Lock className="w-4 h-4" /> },
              { id: "support", label: "Support", count: tickets.filter(t => t.status === "En cours").length || undefined, icon: <HelpCircle className="w-4 h-4 text-sky-500" /> }
            ].map((t) => {
              const isActive = subTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id as ModalSubTab)}
                  className={`flex items-center gap-2.5 py-3 px-4.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? "bg-[#f5a623] text-white shadow-xs" 
                      : "bg-[#eae8e3]/80 hover:bg-[#dedcd7] dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? "text-white" : "text-stone-500"}`}>{t.icon}</span>
                  <span className={`${isActive ? "text-white font-bold" : "text-stone-800 dark:text-stone-200 font-semibold"}`}>{t.label}</span>
                  {t.count !== undefined && (
                    <span className={`ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-stone-250/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Workspace - Scrollable subtab Content & Action Footer */}
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-stone-900 overflow-hidden min-w-0">
          {/* Scrollable Subtab Content Workspace */}
          <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6 min-h-0 bg-white dark:bg-stone-900">
          
          {/* TAB 1: GENERAL - Moved to Main Sidebar Profile section */}
          {false && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* ACTIVE PROFILE CONTROLS */}
                {currentUserEmail ? (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest font-black block text-left">
                      IDENTITÉ DE MON PROFIL
                    </h3>
                    
                    {/* The Profile Card exactly matching the mockup */}
                    <div className="bg-[#eae8e3]/30 dark:bg-stone-850 p-6 rounded-[24px] border border-stone-200/85 dark:border-stone-800 shadow-3xs space-y-5 text-center relative max-w-sm mx-auto">
                      
                      {/* Avatar preview and edit button centered */}
                      <div className="flex justify-center">
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                          <img
                            src={getAvatarPhoto(currentUserAvatar)}
                            alt="Profil"
                            className="w-full h-full rounded-full object-cover border-2 border-stone-100 dark:border-stone-700 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Orange circular edit pen button overlapping bottom right */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowAvatarChooser(!showAvatarChooser);
                            }}
                            className="absolute bottom-1 right-1 bg-[#f5a623] hover:bg-amber-600 text-white p-2 rounded-full shadow-md transition-transform hover:scale-110 cursor-pointer border-2 border-white dark:border-stone-850 flex items-center justify-center"
                            title="Modifier la photo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Avatar Chooser Popover/Drawer below it */}
                      {showAvatarChooser && (
                        <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 text-left animate-slideDown">
                          <span className="block text-[9px] font-mono font-bold text-[#f5a623] uppercase tracking-wider">
                            Choisir une photo recommandée
                          </span>
                          
                          {/* Grid of portrait photos */}
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", // Sophie style
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop", // Marc style
                              "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop", // Pierre style
                              "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop", // Amélie style
                              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", // Jean style
                            ].map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setCurrentUserAvatar(url);
                                  setShowAvatarChooser(false);
                                }}
                                className="w-9 h-9 rounded-full overflow-hidden border-2 border-stone-200 hover:border-amber-500 transition cursor-pointer"
                              >
                                <img src={url} alt="portrait" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                          
                          {/* Option to upload local file */}
                          <div className="relative border border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === "string") {
                                      setCurrentUserAvatar(reader.result);
                                      setShowAvatarChooser(false);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400">
                              📤 Importer un fichier
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Display name inputs */}
                      <div className="space-y-3 text-left">
                        <div>
                          <label className="block text-[9.5px] font-mono font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5 font-bold">
                            NOM À AFFICHER :
                          </label>
                          <input
                            type="text"
                            value={currentUserName}
                            onChange={(e) => setCurrentUserName(e.target.value)}
                            placeholder="Votre nom"
                            className="w-full px-4 py-3 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold transition-all shadow-3xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[9.5px] font-mono font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5 font-bold">
                            ADRESSE MAIL LIÉE :
                          </label>
                          <p className="w-full px-4 py-3 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 font-bold outline-none cursor-not-allowed shadow-3xs truncate">
                            {currentUserEmail}
                          </p>
                        </div>
                      </div>

                      {/* Divider line exactly matching mockup */}
                      <div className="border-t border-stone-200 dark:border-stone-800/80 my-2"></div>

                      {/* Footer statistics exactly matching mockup */}
                      <div className="flex flex-col gap-2.5 text-left text-xs text-stone-700 dark:text-stone-300 font-medium font-sans">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                            <strong className="text-stone-900 dark:text-white font-bold">{reliabilityRating || "4.2"}</strong>
                            <span className="text-stone-500">({reviewsCount || "11"} avis reçus)</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-stone-500">
                            <span className="w-2 h-2 rounded-full bg-[#5ac8fa] animate-pulse shrink-0"></span>
                            <span className="text-stone-900 dark:text-white font-bold">{activeListingsCount || "1"}</span>
                            <span>en ligne</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-500">
                          <ShoppingBag className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="text-stone-900 dark:text-white font-bold">{soldListingsCount || "0"}</span>
                          <span>vendus</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1 max-w-[70%] text-left">
                      <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-widest font-bold">
                        Compte Invité / Anonyme
                      </span>
                      <p className="text-xs text-stone-650 dark:text-stone-300 leading-normal">
                        Entrez dans le réseau pour pouvoir tchater, ajouter des favoris, voir vos commandes et laisser des avis.
                      </p>
                    </div>
                    <button
                      onClick={onOpenLogin}
                      className="bg-amber-600 hover:bg-amber-700 dark:bg-[#fcd462] dark:hover:bg-[#ebd048] text-white dark:text-stone-950 font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Se connecter
                    </button>
                  </div>
                )}

                {/* ADDITIONAL PARAMETERS (NEW ADJUSTMENTS) */}
                <div className="pt-2">
                  <h3 className="text-xs font-mono text-stone-900 dark:text-stone-400 uppercase tracking-wider font-bold mb-3">
                    Ajustabilité des fonctionnalités
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <label className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-850/30 rounded-2xl border border-stone-300 dark:border-stone-850 cursor-pointer hover:bg-stone-100/55 dark:hover:bg-stone-850/60 transition-colors">
                      <div className="text-left pr-2">
                        <p className="text-xs font-bold font-serif text-stone-950 dark:text-stone-200" style={isDarkMode ? undefined : { color: "#33312e" }}>Alertes par mail</p>
                        <p className="text-[10px] text-stone-900 font-medium dark:text-stone-400" style={isDarkMode ? undefined : { color: "#4c453f" }}>Notifié lors d'une nouvelle offre ou message</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={prefNotifEmail} 
                        onChange={(e) => setPrefNotifEmail(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded border-stone-300 text-amber-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-850/30 rounded-2xl border border-stone-300 dark:border-stone-850 cursor-pointer hover:bg-stone-100/55 dark:hover:bg-stone-850/60 transition-colors">
                      <div className="text-left pr-2">
                        <p className="text-xs font-bold font-serif text-stone-950 dark:text-stone-200" style={isDarkMode ? undefined : { color: "#33312e" }}>Arrondir les devises</p>
                        <p className="text-[10px] text-stone-900 font-medium dark:text-stone-400" style={isDarkMode ? undefined : { color: "#4c453f" }}>Afficher des montants simplifiés sans centimes</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={prefRoundedPrices} 
                        onChange={(e) => setPrefRoundedPrices(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded border-stone-300 text-amber-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-850/30 rounded-2xl border border-stone-300 dark:border-stone-850 cursor-pointer hover:bg-stone-100/55 dark:hover:bg-stone-850/60 transition-colors">
                      <div className="text-left pr-2">
                        <p className="text-xs font-bold font-serif text-stone-950 dark:text-stone-200" style={isDarkMode ? undefined : { color: "#33312e" }}>Géolocalisation Auto</p>
                        <p className="text-[10px] text-stone-900 font-medium dark:text-stone-400" style={isDarkMode ? undefined : { color: "#4c453f" }}>Trier les brocantes les plus proches d'abord</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={prefAutoGeo} 
                        onChange={(e) => setPrefAutoGeo(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded border-stone-300 text-amber-600"
                      />
                    </label>

                     {isProUser ? (
                       <label className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-850/30 rounded-2xl border border-stone-300 dark:border-stone-850 cursor-pointer hover:bg-stone-100/55 dark:hover:bg-stone-850/60 transition-colors">
                         <div className="text-left pr-2">
                           <p className="text-xs font-bold font-serif text-stone-950 dark:text-stone-200" style={isDarkMode ? undefined : { color: "#33312e" }}>Simuler un badge VIP</p>
                           <p className="text-[10px] text-stone-900 font-medium dark:text-stone-400" style={isDarkMode ? undefined : { color: "#4c453f" }}>Ajoute une étoile dorée d'accréditation</p>
                         </div>
                         <input 
                           type="checkbox" 
                           checked={prefVipBadge} 
                           onChange={(e) => setPrefVipBadge(e.target.checked)}
                           className="w-4 h-4 accent-amber-500 rounded border-stone-300 text-amber-600 cursor-pointer"
                         />
                       </label>
                     ) : (
                       <div 
                         onClick={onOpenUpgradeModal}
                         className="flex items-center justify-between p-3.5 bg-stone-100/40 dark:bg-stone-900/40 rounded-2xl border border-dashed border-stone-250 dark:border-stone-800 opacity-80 hover:opacity-100 cursor-pointer hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all text-left group"
                         title="Disponible avec l'abonnement Professionnel"
                       >
                         <div className="pr-2">
                           <div className="flex items-center gap-1.5 mb-0.5">
                             <p className="text-xs font-bold font-serif text-stone-950 dark:text-stone-200" style={isDarkMode ? undefined : { color: "#33312e" }}>Badge VIP Accrédité</p>
                             <span className="text-[8px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-extrabold px-1.5 py-0.5 rounded-sm">PRO</span>
                           </div>
                           <p className="text-[10px] text-stone-500 dark:text-stone-400">Réservé aux abonnés professionnels</p>
                         </div>
                         <div className="w-7 h-7 bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-full flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
                           <Crown className="w-3.5 h-3.5 fill-current animate-pulse" />
                         </div>
                       </div>
                     )}

                  </div>
                </div>

                {/* DEVISES */}
                <div className="space-y-3 pt-2">
                  <div className="text-left">
                    <h3 className="text-xs font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider font-bold">
                      Conversion & Devise d'affichage
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                      La devise d'origine de la plateforme est l'<strong>Euro (€)</strong>. Sélectionnez une devise pour convertir tous les prix :
                    </p>
                  </div>

                  {/* Single dropdown select button containing all currency choice elements */}
                  <div className="relative inline-block w-full sm:w-72 text-left">
                    <select
                      value={selectedCurrency.code}
                      onChange={(e) => {
                        const found = CURRENCIES.find(curr => curr.code === e.target.value);
                        if (found) setSelectedCurrency(found);
                      }}
                      className="w-full px-4.5 py-3 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm hover:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/80 transition-all cursor-pointer appearance-none pr-10"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.label} ({curr.symbol}) — 1 € = {curr.rate} {curr.symbol}
                        </option>
                      ))}
                    </select>
                    {/* Visual Chevron or Coin icon on the right */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400">
                      <Coins className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </div>

                {/* APPLICATION THEME */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5 text-left">
                    <span className="block text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                      Apparence visuelle
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">Basculez entre le mode clair protecteur et le mode sombre profond.</p>
                  </div>
                  <div className="flex gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-full sm:w-64 border border-stone-200/50 dark:border-stone-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsDarkMode(false)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        !isDarkMode 
                          ? "bg-white text-stone-900 shadow-3xs" 
                          : "text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Clair</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDarkMode(true)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        isDarkMode 
                          ? "bg-stone-900 text-white shadow-3xs" 
                          : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Sombre</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORDERS (Commandes command purchase list with real interaction) */}
            {subTab === "orders" && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                    📦 Suivi des Échanges & Commandes
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Visualisez vos transactions en cours, vos annonces actives en attente de vente, ainsi que vos acquisitions finalisées.
                  </p>
                </div>

                {/* MY PURCHASES */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 border-b pb-1 dark:border-stone-800">
                    Mes Achats ({myPurchases.length})
                  </h4>

                  {myPurchases.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 dark:bg-stone-850/20 rounded-2xl border border-stone-150 dark:border-stone-850 text-stone-400 text-xs">
                      Aucun achat n'a été initié pour le moment. Cliquez sur "Négocier" ou "Valider l'achat" sur une annonce pour entamer une commande.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {myPurchases.map((l) => {
                        const ratePrice = prefRoundedPrices ? Math.round(l.price) : l.price;
                        const isPending = !l.isSold || !l.buyerConfirmed || !l.sellerConfirmed;
                        return (
                          <div 
                            key={l.id} 
                            className={`p-4 rounded-2xl border transition shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isPending 
                                ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/60" 
                                : "bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img 
                                src={l.imageUrl} 
                                alt={l.title} 
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border dark:border-stone-800"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    Achat N°#CMD-{l.id.toUpperCase().substring(0, 6)}
                                  </span>
                                  {isPending ? (
                                    <span className="text-[9px] font-bold font-mono text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 px-1.5 py-0.5 rounded leading-none">
                                      À Réaliser / En cours
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold font-mono text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 px-1.5 py-0.5 rounded leading-none">
                                      Finalisé
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-xs font-bold font-serif text-stone-950 dark:text-white truncate">
                                  {l.title}
                                </h5>
                                <p className="text-[11px] font-mono text-stone-500">
                                  Vendu par : <strong className="text-stone-700 dark:text-stone-300">{l.sellerName}</strong> • {formatPrice(ratePrice, selectedCurrency)}
                                </p>
                              </div>
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">
                              {l.buyerConfirmed && l.sellerConfirmed ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono leading-none font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                                    <Check className="w-3 h-3" /> Validé & Livré
                                  </span>
                                  <button
                                    onClick={() => setSelectedReceiptListing(l)}
                                    className="p-1 px-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-[10px] font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Visualiser Reçu
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 items-start md:items-end">
                                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-450 bg-amber-500/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 leading-none">
                                    <Clock className="w-3 h-3 animate-spin" /> En attente de remise
                                  </div>
                                  <div className="flex gap-2">
                                    {!l.buyerConfirmed ? (
                                      <button
                                        onClick={() => handleConfirmOrderDelivery(l.id, true)}
                                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                                      >
                                        Confirmer la réception de l'objet
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">Vous avez validé (vendeur en attente)</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* MY SALES */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 border-b pb-1 dark:border-stone-800">
                    Mes Ventes ({allMySales.length})
                  </h4>

                  {allMySales.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 dark:bg-stone-850/20 rounded-2xl border border-stone-150 dark:border-stone-850 text-stone-400 text-xs">
                      Vous n'avez publié aucune annonce de vente pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {allMySales.map((l) => {
                        const ratePrice = prefRoundedPrices ? Math.round(l.price) : l.price;
                        const hasBuyer = !!l.buyerEmail;
                        const isPending = !l.isSold;

                        return (
                          <div 
                            key={l.id} 
                            className={`p-4 rounded-2xl border transition shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isPending 
                                ? hasBuyer 
                                  ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800" 
                                  : "bg-stone-50/40 dark:bg-stone-900/40 border-stone-200 dark:border-stone-850"
                                : "bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img 
                                src={l.imageUrl} 
                                alt={l.title} 
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border dark:border-stone-800"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600">
                                    Vente N°#VTE-{l.id.toUpperCase().substring(0, 6)}
                                  </span>
                                  {!isPending ? (
                                    <span className="text-[9px] font-bold font-mono text-stone-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400 px-1.5 py-0.5 rounded leading-none">
                                      Transaction Terminée
                                    </span>
                                  ) : hasBuyer ? (
                                    <span className="text-[9px] font-bold font-mono text-amber-800 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400 px-1.5 py-0.5 rounded leading-none">
                                      Acheteur Declared (À faire)
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold font-mono text-blue-800 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-400 px-1.5 py-0.5 rounded leading-none">
                                      En Ligne (À vendre)
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-xs font-bold font-serif text-stone-950 dark:text-white truncate">
                                  {l.title}
                                </h5>
                                <p className="text-[11px] font-mono text-stone-500">
                                  {hasBuyer ? (
                                    <>
                                      Acheteur : <strong className="text-stone-700 dark:text-stone-300">{l.buyerName || "Anonyme"}</strong> ({l.buyerEmail})
                                    </>
                                  ) : (
                                    <span className="text-stone-450">Aucun acheteur officiel déclaré pour le moment</span>
                                  )}
                                  {" • "}{formatPrice(ratePrice, selectedCurrency)}
                                </p>
                              </div>
                            </div>

                            {/* Status / Action */}
                            <div className="flex items-center gap-2 md:justify-end shrink-0">
                              {!isPending ? (
                                <>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-gray-500 bg-stone-100 dark:bg-stone-800 dark:text-stone-400 px-2.5 py-1 rounded-full leading-none">
                                    <Truck className="w-3 h-3" /> Livré & Vendu
                                  </span>
                                  <button
                                    onClick={() => setSelectedReceiptListing(l)}
                                    className="p-1 px-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-[10px] font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Ticket de caisse
                                  </button>
                                </>
                              ) : hasBuyer ? (
                                <div className="flex flex-col gap-1.5 items-start md:items-end">
                                  <span className="text-[9.5px] font-mono text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200">
                                    Acheteur en attente de votre confirmation de paiement
                                  </span>
                                  <button
                                    onClick={() => handleConfirmOrderDelivery(l.id, false)}
                                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer shadow-3xs"
                                  >
                                    Confirmer la remise & encaisser
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono leading-none text-blue-600 bg-blue-500/5 px-2.5 py-1 rounded-full border border-blue-200/10">
                                  Disponible sur la brocante
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: FAVORITES (Interesting items) */}
            {subTab === "favorites" && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                    ❤️ Mes Annonces Favorites
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Retrouvez ici tous les produits qui vous ont semblé intéressants dans la brocante. Vous pouvez lancer un tchat direct ou les retirer à tout moment.
                  </p>
                </div>

                {favoritedListings.length === 0 ? (
                  <div className="p-12 text-center bg-stone-50 dark:bg-stone-850/20 rounded-2xl border border-stone-150 dark:border-stone-850 text-stone-500 dark:text-stone-450">
                    <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                    <p className="text-xs font-bold font-serif mb-1">Votre liste est vide</p>
                    <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                      Parcourez la brocante et cliquez sur le petit cœur au-dessus des images pour repérer vos pépites !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favoritedListings.map((l) => (
                      <div 
                        key={l.id} 
                        className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:shadow-xs transition flex gap-3.5"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-stone-100 border dark:border-stone-800 relative">
                          <img 
                            src={l.imageUrl} 
                            alt={l.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="text-left">
                            <span className="text-[8px] font-mono uppercase tracking-widest text-stone-400 font-bold block mb-0.5">{l.category}</span>
                            <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate leading-tight font-serif">{l.title}</h4>
                            <p className="text-[10px] text-stone-500 leading-none mt-1">
                              Prix : <strong className="text-stone-700 dark:text-stone-300">{formatPrice(prefRoundedPrices ? Math.round(l.price) : l.price, selectedCurrency)}</strong>
                            </p>
                            <p className="text-[9px] text-stone-400 flex items-center gap-0.5 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" /> {l.location}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-50 dark:border-stone-850">
                            <span className="text-[9px] font-mono text-stone-400">Vendeur: {l.sellerName}</span>
                            <button
                              onClick={() => setFavorites(prev => prev.filter(favId => favId !== l.id))}
                              className="text-stone-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                              title="Retirer des favoris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: REVIEWS (Notes & Avis left and received) */}
            {subTab === "reviews" && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                    ⭐ Évaluations, Notes & Avis
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Gérez la confiance communautaire de La Brocante. Explorez les retours faits à votre sujet ou rédigez un nouvel avis pour un membre.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* REVIEWS RECEIVED */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-400 border-b pb-1 dark:border-stone-850 font-bold">
                      Avis Reçus ({currentUserEmail ? mockReviewsReceived.length : 0})
                    </h4>

                    {!currentUserEmail ? (
                      <p className="text-[11px] text-stone-400">Connectez un profil pour voir vos notes clients.</p>
                    ) : (
                      <div className="space-y-3">
                        {mockReviewsReceived.length === 0 ? (
                          <p className="text-[11px] text-stone-400 dark:text-stone-550 italic border border-dashed rounded-xl p-4 text-center">Aucun avis reçu pour le moment.</p>
                        ) : (
                          mockReviewsReceived.map((r, i) => {
                            const writerName = (r as any).senderName || (r as any).name || "Utilisateur";
                            const writeAvatar = (r as any).avatar;
                            return (
                              <div key={i} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850/20 border border-stone-200/50 dark:border-stone-850 text-left space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {writeAvatar ? (
                                      <img src={writeAvatar} className="w-5 h-5 rounded-full object-cover" alt="Avatar writer" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 font-serif font-bold text-[9px] flex items-center justify-center">
                                        {writerName.substring(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="text-xs font-bold font-serif text-stone-900 dark:text-white">{writerName}</span>
                                  </div>
                                  <span className="text-[9px] text-stone-400 font-mono">{r.date || "Récemment"}</span>
                                </div>

                                <div className="flex gap-0.5 text-amber-500">
                                  {Array.from({ length: 5 }).map((_, idx) => (
                                    <Star key={idx} className={`w-3 h-3 ${idx < r.rating ? "fill-amber-400" : "text-stone-300 dark:text-stone-700"}`} />
                                  ))}
                                </div>

                                <p className="text-[11px] text-stone-600 dark:text-stone-350 leading-relaxed font-sans italic">
                                  "{r.text}"
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* REVIEWS GIVEN */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-950 border-b pb-1 dark:border-stone-850 font-bold">
                      Émettre un avis sur un fournisseur
                    </h4>

                    {/* Review submission Form */}
                    <form onSubmit={handleSendReview} className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-300 dark:border-stone-800 space-y-3.5 shadow-3xs">
                      
                      <div>
                        <label className="block text-[9px] font-mono text-stone-950 dark:text-stone-400 uppercase font-bold mb-1">
                          Commande éligible :
                        </label>
                        {myPurchases.length === 0 ? (
                          <div className="p-3 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-xl text-stone-800 dark:text-stone-300 text-center font-medium">
                            Vous n'avez pas encore passé de commande pour évaluer un fournisseur.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <select 
                              value={reviewOrderId} 
                              onChange={(e) => {
                                const orderId = e.target.value;
                                setReviewOrderId(orderId);
                                const order = myPurchases.find(o => o.id === orderId);
                                if (order) {
                                  setReviewTargetEmail(order.sellerEmail);
                                } else {
                                  setReviewTargetEmail("");
                                }
                              }}
                              className="w-full text-xs px-2.5 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-950 text-stone-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                              required
                            >
                              <option value="">-- Sélectionner un achat --</option>
                              {myPurchases.map((order) => (
                                <option key={order.id} value={order.id}>
                                  {order.title} (Vendeur : {order.sellerName})
                                </option>
                              ))}
                            </select>
                            {reviewTargetEmail && (
                              <p className="text-[10px] font-mono text-stone-900 dark:text-stone-400 px-1 font-bold">
                                Destinataire cible : <span className="text-amber-700 dark:text-amber-400">{reviewTargetEmail}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-stone-950 dark:text-stone-400 uppercase font-bold mb-1">
                          Note globale (Étoiles) :
                        </label>
                        <div className="flex gap-1.5 py-0.5">
                          {[1, 2, 3, 4, 5].map((stars) => (
                            <button
                              key={stars}
                              type="button"
                              onClick={() => setReviewRating(stars)}
                              className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                              disabled={myPurchases.length === 0}
                            >
                              <Star className={`w-6.5 h-6.5 ${stars <= reviewRating ? "fill-amber-400 text-amber-500" : "text-stone-300 dark:text-stone-750"}`} />
                            </button>
                          ))}
                        </div>
                        {reviewRating === 0 && myPurchases.length > 0 && (
                          <span className="text-[9px] text-amber-750 dark:text-amber-550 font-mono font-bold block mt-0.5">
                            * Veuillez sélectionner une note en cliquant sur les étoiles.
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-stone-950 dark:text-stone-400 uppercase font-bold mb-1">
                          Commentaire public :
                        </label>
                        <textarea
                          placeholder={myPurchases.length === 0 ? "Passez d'abord une commande..." : "Partagez votre retour d'expérience sur l'objet reçu, la ponctualité, le soin..."}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={3}
                          className="w-full text-xs p-3 border border-stone-300 dark:border-stone-750 bg-white dark:bg-stone-950 text-stone-950 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          required
                          disabled={myPurchases.length === 0}
                        />
                      </div>

                      {reviewSuccess && (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-[11px] rounded-xl font-medium">
                          Avis enregistré de manière persistante sur la plateforme !
                        </div>
                      )}

                       <button
                        type="submit"
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Soumettre mon avis
                      </button>
                    </form>

                    {/* PAST REVIEWS EMITTED */}
                    <div className="space-y-2 mt-4">
                      <h5 className="text-[9px] uppercase tracking-wider font-mono font-bold text-stone-400">Vos notes émises ({reviewsLeft.length})</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {reviewsLeft.map((r) => (
                          <div key={r.id} className="p-3 rounded-xl bg-stone-100/50 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-850 text-xs">
                            <div className="flex items-center justify-between pb-1 border-b dark:border-stone-800 mb-1.5 text-stone-500">
                              <strong>À : {r.targetName}</strong>
                              <span className="text-[9px]">{r.date}</span>
                            </div>
                            <div className="flex gap-0.5 text-amber-500 mb-1">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star key={idx} className={`w-2.5 h-2.5 ${idx < r.rating ? "fill-amber-400" : "text-stone-300 dark:text-stone-700"}`} />
                              ))}
                            </div>
                            <p className="dark:text-stone-300 italic">"{r.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 5: SECURITY & ACCOUNT CLOSURE */}
            {subTab === "security" && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                    🔒 Sécurité, Données & Comptes
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Retrouvez l'exhaustivité des informations relatives à votre compte utilisateur actif. Prenez connaissance des procédures de clôture de votre profil.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account detail visualization */}
                  <div className="bg-stone-50 dark:bg-stone-850/20 p-4.5 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-4">
                    <span className="text-[9px] font-mono text-stone-400 uppercase font-bold block border-b pb-1">Votre Fiche d'adhérent</span>
                    
                    <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Statut de membre:</span>
                        <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-450">
                          <ShieldCheck className="w-4 h-4" /> ID Vérifié - Actif
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Identifiant Unique (UID):</span>
                        <span className="font-mono text-[10px] text-stone-700 dark:text-stone-400">usr_cf{currentUserEmail ? currentUserEmail.length * 3 : 10}b_broc</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Date de création du compte:</span>
                        <span className="font-mono">15/02/2026 (Simulé)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Type d'accréditation:</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase font-mono tracking-wider">
                          Personnel & Professionnel
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">IP de connexion estimée:</span>
                        <span className="font-mono text-[10px] text-stone-500">192.168.1.136 (Local)</span>
                      </div>
                    </div>
                  </div>

                  {/* Application Settings Preferences Panel */}
                  <div className="bg-stone-50 dark:bg-stone-850/20 p-4.5 rounded-2xl border border-stone-200 dark:border-stone-850 space-y-4">
                    <span className="text-[9px] font-mono text-stone-400 uppercase font-bold block border-b pb-1">Préférences de l'application</span>
                    
                    <div className="space-y-3.5 text-xs">
                      {/* Notifications Email */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold block text-stone-800 dark:text-stone-200">Alertes e-mail</span>
                          <span className="text-[10px] text-stone-500 block">Recevoir les devis et alertes par e-mail</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefNotifEmail}
                          onChange={(e) => setPrefNotifEmail(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-stone-300 focus:ring-amber-500 rounded-sm cursor-pointer"
                        />
                      </div>

                      {/* Notifications Annonces */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold block text-stone-800 dark:text-stone-200">Alertes de recherche</span>
                          <span className="text-[10px] text-stone-500 block">Notification sur les nouveaux avis de recherche</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefNotifAnnouncements}
                          onChange={(e) => setPrefNotifAnnouncements(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-stone-300 focus:ring-amber-500 rounded-sm cursor-pointer"
                        />
                      </div>

                      {/* Rounded Prices */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold block text-stone-800 dark:text-stone-200">Arrondir les prix</span>
                          <span className="text-[10px] text-stone-500 block">Afficher les prix sans centimes</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefRoundedPrices}
                          onChange={(e) => setPrefRoundedPrices(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-stone-300 focus:ring-amber-500 rounded-sm cursor-pointer"
                        />
                      </div>

                      {/* Auto Geo */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold block text-stone-800 dark:text-stone-200">Géolocalisation</span>
                          <span className="text-[10px] text-stone-500 block">Calculer automatiquement la distance</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefAutoGeo}
                          onChange={(e) => setPrefAutoGeo(e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-stone-300 focus:ring-amber-500 rounded-sm cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ACCOUNT CLOSURE INSTRUCTIONS */}
                  <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 p-4.5 rounded-2xl flex flex-col justify-between text-left md:col-span-2">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold font-serif text-red-700 dark:text-red-450 flex items-center gap-1.5">
                        <ShieldAlert className="w-4.5 h-4.5 shrink-0" /> Clôturer définitivement mon compte
                      </h4>
                      <p className="text-[11px] text-stone-650 dark:text-stone-350 leading-relaxed">
                        Si vous souhaitez clôturer votre compte, toutes vos annonces en ligne, offres en cours, conversations et favoris seront définitivement supprimés de nos archives simulées locales.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowCloseModal(true)}
                      className="mt-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-200 cursor-pointer self-start px-4"
                    >
                      Démarrer la fermeture de compte
                    </button>
                  </div>
                </div>

                {/* CLOSING CONFIRMATION MODAL (OVERLAY IN PARAMETERS) */}
                <AnimatePresence>
                  {showCloseModal && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5.5 bg-red-500/10 dark:bg-red-500/15 rounded-2xl border-2 border-red-500/35 space-y-4 text-left"
                    >
                      <h5 className="font-serif text-sm font-bold text-red-700 dark:text-red-400">🛠️ Double validation requise</h5>
                      <p className="text-xs text-stone-650 dark:text-stone-300">
                        Veuillez saisir votre adresse email exacte (<strong>{currentUserEmail}</strong>) pour confirmer la clôture immédiate de votre compte :
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Saisissez votre email"
                          value={confirmCloseInput}
                          onChange={(e) => setConfirmCloseInput(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border border-red-500/25 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCloseAccount}
                            className="bg-red-650 dark:bg-red-600 hover:bg-red-750 text-white text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer"
                          >
                            Valider la fermeture
                          </button>
                          <button
                            onClick={() => {
                              setShowCloseModal(false);
                              setConfirmCloseInput("");
                            }}
                            className="bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>

                      {isCloseSuccess && (
                        <div className="p-3 bg-red-600 text-white text-xs rounded-xl font-bold font-mono animate-pulse">
                          Clôture en cours... Tous les jetons et comptes ont été re-paramétrés.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* TAB 6: CUSTOMER SERVICE (Service client) */}
            {subTab === "support" && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                    🛠️ Service Clientèle & Créateurs
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Une question ou besoin d'aide pour utiliser La Brocante ? Obtenez des réponses à vos questions ou contactez l'équipe de développement directement.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* SUPPORT FORM */}
                  <div className="bg-white dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-850/70 space-y-4 shadow-3xs">
                    <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest text-stone-400 pb-1.5 border-b dark:border-stone-800">
                      Formulaire d'assistance
                    </h4>

                    <form onSubmit={handleSendSupport} className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-mono text-stone-400 uppercase font-bold mb-1">Objet de votre demande :</label>
                        <select
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                          className="w-full text-xs px-2.5 py-2 border border-stone-250 dark:border-stone-750 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
                        >
                          <option value="Question générale">Question générale</option>
                          <option value="Bug / Problème technique">Bug / Problème technique</option>
                          <option value="Contestation de transaction">Contestation de transaction</option>
                          <option value="Suggestion d'amélioration">Suggestion d'amélioration</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-stone-400 uppercase font-bold mb-1">Votre message détaillé :</label>
                        <textarea
                          placeholder="Décrivez clairement ce dont vous avez besoin..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          rows={4}
                          className="w-full text-xs p-3 border border-stone-250 dark:border-stone-750 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                          required
                        />
                      </div>

                      {ticketSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-450 text-[11px] rounded-xl font-medium leading-relaxed">
                          La demande a été enregistrée avec succès sous la référence unique. Vous pouvez suivre l'évolution ci-dessous.
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSendingTicket}
                        className="w-full py-2 bg-stone-950 hover:bg-stone-800 dark:bg-white dark:text-stone-950 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSendingTicket ? (
                          <span className="w-4 h-4 border-2 border-stone-500 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Envoyer au Service Client</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* COORDS & PAST TICKETS */}
                  <div className="space-y-4">
                    <div className="bg-stone-50 dark:bg-stone-850/20 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                      <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest text-stone-400">
                        Nos Coordonnées Directes
                      </h4>
                      <p className="text-[11px] text-stone-500 leading-normal">
                        Ce site a été conçu par les administrateurs de la brocante locale. Vous pouvez nous joindre également hors ligne :
                      </p>
                      
                      <div className="space-y-2 pt-1 text-xs text-stone-700 dark:text-stone-300 font-sans">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>support@la-brocante.fr</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>0 800 123 456 (Numéro Vert Gratuit)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>12 Rue du Grenier sur l'Eau, 75004 Paris</span>
                        </div>
                      </div>
                    </div>

                    {/* PAST TICKETS */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest text-stone-400">
                        Vos demandes précédentes ({tickets.length})
                      </h4>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {tickets.map((t) => (
                          <div key={t.id} className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-left">
                            <div className="flex items-center justify-between font-mono text-[9px] text-stone-400 pb-1 border-b dark:border-stone-850 mb-1.5">
                              <span>Ref: {t.id}</span>
                              <span className={`px-2 py-0.5 rounded-full font-bold select-none ${
                                t.status === "Résolu" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-500"
                              }`}>{t.status}</span>
                            </div>
                            <p className="font-bold text-stone-900 dark:text-stone-200">{t.subject}</p>
                            <p className="text-stone-500 dark:text-stone-450 mt-0.5 leading-relaxed">"{t.message}"</p>
                            
                            {t.answer && (
                              <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-l-2 border-amber-500 rounded-r-lg">
                                <p className="text-[9px] font-mono text-stone-400 uppercase font-bold mb-0.5">Réponse du Support :</p>
                                <p className="leading-relaxed">"{t.answer}"</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 7: SIMULATED - Moved to Main Sidebar Profile section */}
            {false && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                      👥 Comptes & Profils Simulés
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      Basculez instantanément d'un profil de test à un autre pour essayer d'acheter ou de vendre des canapés, consoles, vélos ou vêtements.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-xs font-mono font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showAddForm ? "Annuler" : "+ Créer Nouveau"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* INLINE CREATE FORM */}
                  {showAddForm && (
                    <div className="md:col-span-1 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 shadow-3xs">
                      <p className="text-[10px] text-stone-400 font-mono font-bold uppercase pb-1 border-b dark:border-stone-850">Créer & Connecter</p>
                      
                      <form onSubmit={handleCreateProfile} className="space-y-3.5">
                        <input
                          type="text"
                          placeholder="Nom complet"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-medium"
                          required
                        />
                        <input
                          type="email"
                          placeholder="Adresse email"
                          value={newAccEmail}
                          onChange={(e) => setNewAccEmail(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white font-medium"
                          required
                        />
                        
                        <div className="space-y-1 text-left">
                          <span className="block text-[8px] font-mono text-stone-400 dark:text-stone-500 uppercase font-bold">Photo de Profil :</span>
                          
                          <div className="bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                            <div className="flex items-center gap-2">
                              <img src={getAvatarPhoto(newAccAvatar)} alt="Aperçu" className="w-6.5 h-6.5 rounded-full object-cover border border-amber-300 shrink-0" referrerPolicy="no-referrer" />
                              <div className="leading-none">
                                <span className="text-[9px] text-stone-500 font-medium font-mono block">Aperçu de votre photo</span>
                                <span className="text-[7.5px] text-stone-400">Téléchargez votre propre portrait</span>
                              </div>
                            </div>
                            
                            <div className="text-[9px] space-y-1 border-t border-dashed border-stone-200 dark:border-stone-800 pt-1.5 mt-1.5">
                              <span className="block text-[7px] font-mono text-stone-400 uppercase font-bold">Fichier d'image local de votre choix :</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="w-full text-[8px] file:mr-1 file:py-0.5 file:px-1.5 file:rounded-md file:border-0 file:text-[8px] file:font-semibold file:bg-stone-200 file:text-stone-700 dark:file:bg-stone-800 dark:file:text-stone-300 font-sans cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-xl transition cursor-pointer"
                        >
                          Créer et switcher
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ACCOUNT SWITCH GRID */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${showAddForm ? "md:col-span-2" : "md:col-span-3"}`}>
                    {simulatedAccounts
                      .filter((acc) => {
                        const cleanEmail = currentUserEmail.toLowerCase().trim();
                        if (cleanEmail === "fd6016826@gmail.com") {
                          return true;
                        }
                        return acc.email.toLowerCase().trim() === cleanEmail;
                      })
                      .map((acc) => {
                        const isActive = currentUserEmail.toLowerCase() === acc.email.toLowerCase();
                      return (
                        <button
                          key={acc.email}
                          onClick={() => handleSwitchProfile(acc.email)}
                          className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isActive
                              ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500 shadow-2xs"
                              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-2xs border bg-stone-200 dark:border-stone-850">
                              <img
                                src={getAvatarPhoto(acc.avatar)}
                                alt={acc.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="truncate leading-tight">
                              <span className={`block text-xs font-bold truncate leading-tight ${isActive ? "text-amber-700 dark:text-amber-400" : "text-stone-800 dark:text-stone-200"}`}>
                                {acc.name}
                              </span>
                              <span className="text-[9px] text-stone-400 dark:text-stone-500 block font-mono truncate">
                                {acc.email}
                              </span>
                            </div>
                          </div>
                          {isActive ? (
                            <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3px]" />
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-700 group-hover:text-stone-400 transition-transform" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* TAB-INDEPENDENT ACTION FOOTER */}
          <div className="border-t border-stone-150 dark:border-stone-800 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-[#faf9f6] dark:bg-stone-900/40">
            {currentUserEmail ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentUserEmail("");
                  setCurrentUserName("");
                  setCurrentUserAvatar(DEFAULT_AVATAR_PLACEHOLDER);
                  onClose();
                }}
                className="w-full sm:w-auto bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold py-2.5 px-4.5 rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer border border-red-200/50 dark:border-red-900/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter (Mode Invité)</span>
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={onClose}
                className="w-full sm:w-44 py-2.5 bg-stone-900 dark:bg-white dark:text-stone-950 text-white font-bold text-xs rounded-xl shadow-xs transition hover:bg-stone-800 dark:hover:bg-stone-100 cursor-pointer text-center"
              >
                Enregistrer & Fermer
              </button>
            </div>
          </div>
        </div>

      </motion.div>

      {/* FLOATING DETAILED RECEIPT / PRINTABLE INVOICE MODAL (TIMELINE AND FACTURE) */}
      <AnimatePresence>
        {selectedReceiptListing && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-stone-950/60"
              onClick={() => setSelectedReceiptListing(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="relative p-6 sm:p-8 bg-[#fcf9f2] dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-[24px] w-full max-w-md font-mono text-xs border border-amber-900/15 dark:border-stone-800 shadow-2xl flex flex-col justify-between whitespace-pre-wrap leading-relaxed shadow-stone-950/40"
            >
              {/* Header */}
              <div className="text-center pb-3 border-b-2 border-dashed border-stone-300 dark:border-stone-750">
                <h4 className="text-sm font-bold uppercase tracking-widest font-serif leading-none mb-1 text-stone-950 dark:text-white">LA BROCANTE</h4>
                <p className="text-[10px] text-stone-500 dark:text-stone-400">PROVENCE-ALPES-CÔTE D'AZUR</p>
                <p className="text-[9px] text-stone-400 dark:text-stone-500 italic">Plateforme Libre de Remise en Mains Propres</p>
              </div>

              {/* Ticket Body details */}
              <div className="py-4 space-y-3.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span>Justificatif N°:</span>
                  <span className="font-bold">CMD-{selectedReceiptListing.id.toUpperCase().substring(0, 8)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span>Date d'achat:</span>
                  <span>{new Date(selectedReceiptListing.createdAt).toLocaleString("fr-FR")}</span>
                </div>

                <div className="border-t border-dashed border-stone-300 dark:border-stone-750 pt-3">
                  <span className="text-[9px] text-stone-400 dark:text-stone-500 uppercase font-bold block mb-1">Article transactionné :</span>
                  <div className="flex justify-between font-bold text-stone-950 dark:text-white">
                    <span className="truncate max-w-[80%]">{selectedReceiptListing.title}</span>
                    <span>1x</span>
                  </div>
                  <div className="flex justify-between text-stone-500 dark:text-stone-400 pl-2">
                    <span>État: {selectedReceiptListing.condition}</span>
                    <span>{formatPrice(selectedReceiptListing.price, selectedCurrency)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-300 dark:border-stone-750 pt-3 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>Sous-total:</span>
                    <span>{formatPrice(selectedReceiptListing.price, selectedCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Frais de service Brocante:</span>
                    <span className="text-green-700 dark:text-emerald-400">0.00 € (Gratuit)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Taxes locales (TVA):</span>
                    <span>0.00 €</span>
                  </div>
                  <div className="flex justify-between text-stone-950 dark:text-white text-sm font-bold border-t border-stone-300 dark:border-stone-700 pt-1.5 mt-1.5 uppercase">
                    <span>TOTAL :</span>
                    <span>{formatPrice(selectedReceiptListing.price, selectedCurrency)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-300 dark:border-stone-750 pt-3.5 space-y-1.5 text-[10px]">
                  <p><strong>Acheteur :</strong> {selectedReceiptListing.buyerName || "M. Anonyme"}</p>
                  <p className="text-stone-400 dark:text-stone-500 font-mono text-[9px]">({selectedReceiptListing.buyerEmail})</p>
                  <p className="mt-1"><strong>Vendeur :</strong> {selectedReceiptListing.sellerName}</p>
                </div>

                {/* Simulated signature stamp and nice message */}
                <div className="bg-white dark:bg-stone-950 p-3 rounded-lg border border-amber-900/10 dark:border-stone-800 text-center relative mt-2">
                  <span className="absolute top-1.5 right-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono uppercase">Vérifié</span>
                  <p className="text-[9px] font-bold text-amber-800 dark:text-amber-500">Double validation validée</p>
                  <p className="text-[8px] text-stone-450 dark:text-stone-400 leading-tight mt-0.5">Le vendeur et l'acheteur attestent avoir échangé cet objet en conformité locale.</p>
                </div>

                {selectedReceiptListing.isSold && (
                  <div className="my-3 border-2 border-dashed border-red-600/30 text-red-600 dark:text-red-400 p-2 rounded-lg text-center transform -rotate-2 font-black uppercase tracking-wider text-[11px] font-mono bg-red-50/20 dark:bg-red-950/10">
                    ✦ STATUT FINAL : VENDU & ÉPUISÉ ✦
                  </div>
                )}
              </div>

              {/* Close Button print instructions */}
              <div className="border-t-2 border-dashed border-stone-300 pt-3.5 flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-stone-900 text-white font-bold text-xs rounded-lg transition hover:bg-stone-800 cursor-pointer text-center"
                >
                  🖨️ Imprimer la Facture
                </button>
                <button
                  onClick={() => setSelectedReceiptListing(null)}
                  className="w-full py-2 bg-stone-200 text-stone-700 font-bold text-xs rounded-lg transition hover:bg-stone-300 cursor-pointer text-center"
                >
                  Fermer
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
