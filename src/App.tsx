import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  SlidersHorizontal, 
  MessageCircle, 
  User, 
  X, 
  ChevronDown, 
  HelpCircle,
  RefreshCw,
  Coins,
  ArrowRightLeft,
  UserCheck,
  Menu,
  Home,
  Bell,
  Crown,
  Sparkles,
  Megaphone,
  Check,
  Sun,
  Moon,
  Users,
  Link,
  ShieldCheck
} from "lucide-react";
import { Listing, ChatThread } from "./types";
import { ListingCard } from "./components/ListingCard";
import { ListingDetailsModal } from "./components/ListingDetailsModal";
import { CreateListingModal } from "./components/CreateListingModal";
import { CreateDemandModal } from "./components/CreateDemandModal";
import { DirectChat } from "./components/DirectChat";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { SellerDashboard } from "./components/SellerDashboard";
import { AccountManagementModal } from "./components/AccountManagementModal";
import { PremiumUpgradeModal } from "./components/PremiumUpgradeModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { ProBadge } from "./components/ProBadge";
import { AdminDashboard } from "./components/AdminDashboard";
import { CURRENCIES, Currency, formatPrice } from "./utils/currency";
import { motion, AnimatePresence } from "motion/react";
import { ExpandableTabs } from "./components/ui/expandable-tabs";
import { NotificationCenter, NotificationItem } from "./components/NotificationCenter";

const CATEGORIES = [
  "Toutes",
  "Électronique",
  "Mode & Vêtements",
  "Maison & Déco",
  "Véhicules",
  "Sport & Loisirs",
  "Livres & Culture",
  "Jeux & Jouets",
  "Autres"
];

const CONDITIONS = [
  "Toutes",
  "Neuf",
  "Comme neuf",
  "Très bon état",
  "Bon état",
  "Usagé"
];

export const DEFAULT_AVATAR_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231e293b'/><stop offset='100%' stop-color='%230f172a'/></linearGradient></defs><rect width='100' height='100' fill='url(%23g)'/><circle cx='50' cy='42' r='16' fill='%23fbbf24'/><path d='M22,80 C22,64 32,56 50,56 C68,56 78,64 78,80' fill='%23fbbf24'/></svg>";

const getAvatarPhoto = (av: string) => {
  if (av && (av.startsWith("http") || av.startsWith("data:"))) {
    return av;
  }
  return DEFAULT_AVATAR_PLACEHOLDER;
};

export default function App() {
  // Listings States
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Buyer Demand & Announcements States
  const [demands, setDemands] = useState<any[]>([]);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isDemandsBannerExpanded, setIsDemandsBannerExpanded] = useState(false);
  const [demandsSearchQuery, setDemandsSearchQuery] = useState("");
  const [selectedUserProfile, setSelectedUserProfile] = useState<{ name: string; email: string } | null>(null);

  // Active Login Profile Simulator (Guest by default, loaded from localStorage)
  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    try {
      return localStorage.getItem("brocante_current_user_email") || "";
    } catch {
      return "";
    }
  });

  const [currentUserName, setCurrentUserName] = useState(() => {
    try {
      return localStorage.getItem("brocante_current_user_name") || "";
    } catch {
      return "";
    }
  });

  const [currentUserAvatar, setCurrentUserAvatar] = useState(() => {
    try {
      return localStorage.getItem("brocante_current_user_avatar") || DEFAULT_AVATAR_PLACEHOLDER;
    } catch {
      return DEFAULT_AVATAR_PLACEHOLDER;
    }
  });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Active Session JWT Token (stored inside sessionStorage for safety)
  const [sessionToken, setSessionToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem("brocante_session_token") || "";
    } catch {
      return "";
    }
  });

  // Pro Subscription status & Premium Upgrade modal states
  const [isProUser, setIsProUser] = useState<boolean>(() => {
    try {
      const email = localStorage.getItem("brocante_current_user_email") || "";
      if (!email) return false;
      return localStorage.getItem(`brocante_pro_${email.toLowerCase()}`) === "true";
    } catch {
      return false;
    }
  });
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  // Automatic sync of Pro status when account email changes
  useEffect(() => {
    if (!currentUserEmail) {
      setIsProUser(false);
      return;
    }
    const isPro = localStorage.getItem(`brocante_pro_${currentUserEmail.toLowerCase()}`) === "true";
    setIsProUser(isPro);
  }, [currentUserEmail]);

  // Active theme preference states (Light vs Dark mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("brocante_theme") === "dark";
    } catch {
      return false;
    }
  });

  // Settings window visibility toggle
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active Simulated Accounts list state
  const [simulatedAccounts, setSimulatedAccounts] = useState<{ email: string; name: string; avatar: string }[]>(() => {
    try {
      const stored = localStorage.getItem("brocante_simulated_accounts");
      const parsed = stored ? JSON.parse(stored) : [];
      const defaults = [
        { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
        { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" }
      ];
      const forbidden = ["antigravity@la-brocante.fr", "marc.dupuis@outlook.fr", "pierre.m@gmail.com"];
      const filteredParsed = parsed.filter((a: any) => a && a.email && !forbidden.includes(a.email.toLowerCase().trim()));
      
      const merged = [...defaults];
      filteredParsed.forEach((a: any) => {
        if (!merged.some(m => m.email.toLowerCase().trim() === a.email.toLowerCase().trim())) {
          merged.push(a);
        }
      });
      return merged;
    } catch {
      return [
        { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
        { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" }
      ];
    }
  });

  // Sidebar dynamic new account creation states
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccAvatar, setNewAccAvatar] = useState(DEFAULT_AVATAR_PLACEHOLDER);

  // Extra parameters toggle states
  const [prefNotifEmail, setPrefNotifEmail] = useState<boolean>(() => {
    return localStorage.getItem("pref_notif_email") !== "false";
  });
  const [prefNotifAnnouncements, setPrefNotifAnnouncements] = useState<boolean>(() => {
    return localStorage.getItem("pref_notif_announcements") !== "false";
  });
  const [prefRoundedPrices, setPrefRoundedPrices] = useState<boolean>(() => {
    return localStorage.getItem("pref_rounded_prices") === "true";
  });
  const [prefAutoGeo, setPrefAutoGeo] = useState<boolean>(() => {
    return localStorage.getItem("pref_auto_geo") !== "false";
  });
  const [prefVipBadge, setPrefVipBadge] = useState<boolean>(() => {
    return localStorage.getItem("pref_vip_badge") === "true";
  });

  // Persist preference adjustments
  useEffect(() => {
    localStorage.setItem("pref_notif_email", String(prefNotifEmail));
  }, [prefNotifEmail]);
  useEffect(() => {
    localStorage.setItem("pref_notif_announcements", String(prefNotifAnnouncements));
    if (currentUserEmail) {
      fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail, prefNotifAnnouncements })
      }).catch(err => console.warn("Failed to sync announcements preference:", err));
    }
  }, [prefNotifAnnouncements, currentUserEmail]);
  useEffect(() => {
    localStorage.setItem("pref_rounded_prices", String(prefRoundedPrices));
  }, [prefRoundedPrices]);
  useEffect(() => {
    localStorage.setItem("pref_auto_geo", String(prefAutoGeo));
  }, [prefAutoGeo]);
  useEffect(() => {
    localStorage.setItem("pref_vip_badge", String(prefVipBadge));
  }, [prefVipBadge]);

  // Active currency choice state
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // View state transitions
  const [viewMode, setViewMode] = useState<"landing" | "marketplace" | "dashboard" | "messages" | "notifications" | "demands" | "admin">("landing");


  // Bottom navigation visibility states and handlers on scroll
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let accumulatedScroll = 0;

    const handleScroll = () => {
      const scrollContainer = document.getElementById("app-root-scroll-container");
      const currentScrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const clientHeight = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
      const scrollHeight = scrollContainer ? scrollContainer.scrollHeight : document.documentElement.scrollHeight;
      
      const deltaY = currentScrollY - lastScrollY.current;

      // Reset accumulated scroll on direction change
      if (deltaY > 0 && accumulatedScroll < 0) accumulatedScroll = 0;
      if (deltaY < 0 && accumulatedScroll > 0) accumulatedScroll = 0;

      accumulatedScroll += deltaY;

      // If scrolled down significantly (e.g. > 40px) and past page start, hide
      if (accumulatedScroll > 40 && currentScrollY > 100) {
        setIsNavVisible(false);
      } 
      // If scrolled up significantly (e.g. < -40px) or near top, show
      else if (accumulatedScroll < -40 || currentScrollY < 50) {
        setIsNavVisible(true);
      }

      // Always show at absolute bottom of page to prevent being stuck invisible
      const isAtBottom = (clientHeight + currentScrollY) >= scrollHeight - 75;
      if (isAtBottom) {
        setIsNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    const scrollContainer = document.getElementById("app-root-scroll-container");
    const target = scrollContainer || window;

    target.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [viewMode]);

  const getViewIndex = () => {
    switch (viewMode) {
      case "landing":
        return 0;
      case "marketplace":
        return 1;
      case "notifications":
        return 2;
      case "demands":
        return 3;
      case "dashboard":
        return 5;
      case "messages":
        return 6;
      default:
        return null;
    }
  };

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    if (index === 0) {
      setViewMode("landing");
    } else if (index === 1) {
      setViewMode("marketplace");
    } else if (index === 2) {
      if (!currentUserEmail) {
        setIsLoginOpen(true);
      } else {
        setViewMode("notifications");
      }
    } else if (index === 3) {
      setViewMode("demands");
    } else if (index === 5) {
      if (!currentUserEmail) {
        setIsLoginOpen(true);
      } else {
        setViewMode("dashboard");
      }
    } else if (index === 6) {
      if (!currentUserEmail) {
        setIsLoginOpen(true);
      } else {
        setViewMode("messages");
      }
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch user notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!currentUserEmail) {
      setNotifications([]);
      return;
    }
    try {
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Erreur chargement notifications :", err);
    }
  }, [currentUserEmail]);

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUserEmail) return;
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNotification = useCallback((title: string, message: string, type: "system" | "offer" | "neighbor" | "transaction") => {
    // Legacy support for memory injection if needed
    setNotifications(prev => [
      {
        id: `notif_${Date.now()}`,
        title,
        message,
        time: "À l'instant",
        type,
        read: false
      },
      ...prev
    ]);
  }, []);

  const handleToggleNotificationRead = async (id: string) => {
    const current = notifications.find(n => n.id === id);
    if (!current) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !current.read })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentUserEmail) return;
    try {
      const res = await fetch("/api/notifications/clear-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showGlobalTerms, setShowGlobalTerms] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [selectedCondition, setSelectedCondition] = useState("Toutes");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc">("newest");
  
  // Mobile responsive layout states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  
  // Modals Toggles
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDemandInfoModal, setShowDemandInfoModal] = useState(false);

  // Chat/Threads DB states
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [chatInputToInject, setChatInputToInject] = useState<string | null>(null);

  const isAnyModalOpen = !!(
    isCreateModalOpen ||
    isDemandModalOpen ||
    activeListing ||
    isPremiumModalOpen ||
    selectedUserProfile ||
    isAccountModalOpen ||
    showDemandInfoModal ||
    showGlobalTerms ||
    isLoginOpen
  );

  const shouldHideNav = isAnyModalOpen || (viewMode === "messages" && !!activeThreadId);

  // User's interesting products/favorites list state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("brocante_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("brocante_favorites", JSON.stringify(favorites));
    } catch (e) {
      console.warn("Could not save favorites to localStorage", e);
    }
  }, [favorites]);

  // Load listings from REST API
  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory && selectedCategory !== "Toutes") params.append("category", selectedCategory);
      if (selectedCondition && selectedCondition !== "Toutes") params.append("condition", selectedCondition);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (locationQuery) params.append("location", locationQuery);

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        
        // Apply sorting on client
        let sorted = [...data];
        sorted.sort((a, b) => {
          const aSpon = a.isSponsored ? 1 : 0;
          const bSpon = b.isSponsored ? 1 : 0;
          if (aSpon !== bSpon) {
            return bSpon - aSpon; // sponsorised before standard
          }
          
          if (sortBy === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (sortBy === "priceAsc") {
            return a.price - b.price;
          } else if (sortBy === "priceDesc") {
            return b.price - a.price;
          }
          return 0;
        });

        setListings(sorted);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des annonces :", err);
    } finally {
      setLoadingListings(false);
    }
  }, [searchQuery, selectedCategory, selectedCondition, minPrice, maxPrice, locationQuery, sortBy]);

  // Load chat conversations for current simulated profile
  const fetchChats = useCallback(async () => {
    if (!currentUserEmail) return;
    try {
      const res = await fetch(`/api/chats?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (err) {
      console.error("Erreur chargement messages :", err);
    }
  }, [currentUserEmail]);

  // Load buyer demands/announcements
  const fetchDemands = useCallback(async () => {
    try {
      const res = await fetch("/api/demands");
      if (res.ok) {
        const data = await res.json();
        setDemands(data);
      }
    } catch (err) {
      console.error("Erreur chargement demandes d'achat :", err);
    }
  }, []);

  // Fetch simulated accounts from the database
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSimulatedAccounts(data);
        }
      }
    } catch (err) {
      console.error("Erreur chargement utilisateurs de test :", err);
    }
  }, []);

  // Fetch initial users list on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefreshChatsAndListings = useCallback(async () => {
    await fetchChats();
    await fetchListings();
    await fetchDemands();
    await fetchUsers();
    await fetchNotifications();
  }, [fetchChats, fetchListings, fetchDemands, fetchUsers, fetchNotifications]);

  // Mark chat messages as read
  const markChatAsRead = useCallback(async (threadId: string) => {
    if (!currentUserEmail || !threadId) return;
    try {
      const res = await fetch(`/api/chats/${threadId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUserEmail }),
      });
      if (res.ok) {
        fetchChats();
      }
    } catch (err) {
      console.error("Erreur marquage lu :", err);
    }
  }, [currentUserEmail, fetchChats]);

  // Buyer confirms purchase
  const handleConfirmPurchase = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerEmail: currentUserEmail, buyerName: currentUserName }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (activeListing && activeListing.id === id) {
          setActiveListing(updated);
        }
        fetchListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Seller confirms sale
  const handleConfirmSale = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}/sell`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        if (activeListing && activeListing.id === id) {
          setActiveListing(updated);
        }
        fetchListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // URL parameters handling state
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);

  // Bootstraps initial state and processes URL parameters
  useEffect(() => {
    const init = async () => {
      await fetchListings();
      await fetchDemands();
    };
    init();
  }, [fetchListings, fetchDemands]);

  useEffect(() => {
    if (urlParamsProcessed || listings.length === 0 && demands.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const sharedListingId = params.get("listingId");
    const sharedDemandId = params.get("demandId");

    if (sharedListingId) {
      const match = listings.find(l => l.id === sharedListingId);
      if (match) {
        setActiveListing(match);
        setViewMode("marketplace");
        setUrlParamsProcessed(true);
      }
    } else if (sharedDemandId) {
      const match = demands.find(d => d.id === sharedDemandId);
      if (match) {
        setViewMode("demands");
        // We will pre-fill the demandsSearchQuery or apply a special highlighting
        setDemandsSearchQuery(match.title);
        setUrlParamsProcessed(true);
      }
    }
  }, [listings, demands, urlParamsProcessed]);

  useEffect(() => {
    fetchChats();
    fetchListings();
    fetchDemands();
    fetchNotifications();
  }, [currentUserEmail, fetchChats, fetchListings, fetchDemands, fetchNotifications]);

  // Trigger read marking when active discussion changes
  useEffect(() => {
    if (activeThreadId) {
      markChatAsRead(activeThreadId);
    }
  }, [activeThreadId, markChatAsRead]);

  // Send message API trigger (supports buyer & seller reply contexts)
  const handleSendMessage = async (listingId: string, text: string, buyerEmail?: string, buyerName?: string) => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          listingId,
          text,
          senderEmail: currentUserEmail,
          senderName: currentUserName,
          buyerEmail: buyerEmail || currentUserEmail,
          buyerName: buyerName || currentUserName,
        }),
      });

      if (response.ok) {
        const updatedThread = await response.json();
        // Sync inbox instantly
        await fetchChats();
        // Set active thread focusing
        setActiveThreadId(updatedThread.id);
      }
    } catch (err) {
      console.error("Erreur d'envoi", err);
    }
  };

  // Contact a buyer asserting proposal for their demand announcement
  const handleContactBuyer = async (demand: any) => {
    try {
      if (!currentUserEmail) {
        setIsLoginOpen(true);
        return;
      }
      
      // Pro subscription is required to offer articles to buyers (Recherches Citoyennes)
      if (!isProUser) {
        setIsPremiumModalOpen(true);
        return;
      }

      const formattedBudget = formatPrice(demand.desiredPrice, selectedCurrency);
      const initialMessageText = `Bonjour **${demand.buyerName}**, j'ai vu votre avis de recherche pour "**${demand.title}**" (Budget max: **${formattedBudget}**). Je possède cet article et je serais intéressé(e) pour vous le proposer. Est-il toujours recherché ?`;

      // Set chat input to inject into the editor instead of sending it directly
      setChatInputToInject(initialMessageText);

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          listingId: "demand_ref_" + demand.id,
          listingTitle: `[Recherche] ${demand.title}`,
          listingPrice: demand.desiredPrice,
          listingImageUrl: demand.imageUrl,
          senderEmail: currentUserEmail,
          senderName: currentUserName,
          buyerEmail: demand.buyerEmail,
          buyerName: demand.buyerName,
          text: "", // Empty to let the user review and click send manually
        }),
      });

      if (response.ok) {
        const updatedThread = await response.json();
        await fetchChats();
        setActiveThreadId(updatedThread.id);
        setViewMode("messages");
      }
    } catch (err) {
      console.error("Erreur de contact de l'acheteur", err);
    }
  };

  // Helper to open create listing modal checking standard user limits (max 5 announcements)
  const handleOpenCreateListing = () => {
    if (!currentUserEmail) {
      setIsLoginOpen(true);
      return;
    }
    const myListings = listings.filter(l => l.sellerEmail.toLowerCase() === currentUserEmail.toLowerCase());
    if (!isProUser && myListings.length >= 5) {
      setIsPremiumModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  // Create Listing API trigger
  const handleCreateListingSubmit = async (listingPayload: any) => {
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify(listingPayload),
      });

      if (res.ok) {
        fetchListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Demand / Purchase query API trigger
  const handleCreateDemandSubmit = async (demandPayload: any) => {
    try {
      const res = await fetch("/api/demands", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify(demandPayload),
      });

      if (res.ok) {
        fetchDemands();
      }
    } catch (err) {
      console.error("Erreur de publication de recherche", err);
    }
  };

  // Toggle items state (marked sold vs available)
  const handleToggleSold = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}/toggle-sold`, {
        method: "PATCH",
      });
      if (res.ok) {
        const updated = await res.json();
        if (activeListing && activeListing.id === id) {
          setActiveListing(updated);
        }
        fetchListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Listing completely
  const handleDeleteListing = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${sessionToken}`
        }
      });
      if (res.ok) {
        setActiveListing(null);
        fetchListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Listing completely
  const handleEditListing = async (id: string, updatedData: Partial<Listing>) => {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        const updated = await res.json();
        if (activeListing && activeListing.id === id) {
          setActiveListing(updated);
        }
        fetchListings();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleStartChatFromDetails = async (listingId: string, initialText: string) => {
    await handleSendMessage(listingId, initialText);
    setViewMode("messages");
  };

  const handleContactSeller = async (listing: Listing, requestedQty: number = 1) => {
    if (!currentUserEmail) {
      setIsLoginOpen(true);
      return;
    }

    setChatInputToInject(`Bonjour, je suis intéressé par votre annonce : **${listing.title}**.\n\nJe souhaiterais en acheter **${requestedQty}** exemplaire(s) ! Merci de me confirmer si cela est possible.`);

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          listingId: listing.id,
          text: "", // signifies empty message, just to open/find/create thread
          senderEmail: currentUserEmail,
          senderName: currentUserName,
          buyerEmail: currentUserEmail,
          buyerName: currentUserName,
          requestedQuantity: requestedQty,
        }),
      });

      if (response.ok) {
        const thread = await response.json();
        await fetchChats();
        setActiveThreadId(thread.id);
        setViewMode("messages");
        setActiveListing(null);
      }
    } catch (err) {
      console.error("Erreur lors de l'initiation du chat de l'annonce :", err);
    }
  };

  // Synchronization effects for persistent context
  useEffect(() => {
    try {
      localStorage.setItem("brocante_current_user_email", currentUserEmail);
      localStorage.setItem("brocante_current_user_name", currentUserName);
      localStorage.setItem("brocante_current_user_avatar", currentUserAvatar);
    } catch (e) {
      console.error(e);
    }
  }, [currentUserEmail, currentUserName, currentUserAvatar]);

  useEffect(() => {
    try {
      localStorage.setItem("brocante_theme", isDarkMode ? "dark" : "light");
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      localStorage.setItem("brocante_simulated_accounts", JSON.stringify(simulatedAccounts));
    } catch (e) {
      console.error(e);
    }
  }, [simulatedAccounts]);

  const handleProfileSwitch = (email: string) => {
    const acc = simulatedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    const mockToken = `mock_jwt_token_${email.toLowerCase().trim()}_${Date.now()}`;
    sessionStorage.setItem("brocante_session_token", mockToken);
    setSessionToken(mockToken);

    if (acc) {
      setCurrentUserEmail(acc.email);
      setCurrentUserName(acc.name);
      setCurrentUserAvatar(acc.avatar);
    } else {
      const rawName = email.split("@")[0];
      const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      setCurrentUserEmail(email);
      setCurrentUserName(capitalizedName);
      setCurrentUserAvatar("🦊");
    }
    setIsAccountModalOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("brocante_session_token");
    setSessionToken("");
    setCurrentUserEmail("");
    setCurrentUserName("");
    setCurrentUserAvatar(DEFAULT_AVATAR_PLACEHOLDER);
    setViewMode("landing");
    setActiveThreadId(null);
    setIsSidebarOpen(false);
    setIsAccountModalOpen(false);
  };

  const totalUnreadSim = threads.length; // Count total discussions active

  const activeFiltersCount = [
    searchQuery !== "",
    selectedCategory !== "Toutes",
    selectedCondition !== "Toutes",
    minPrice !== "",
    maxPrice !== "",
    locationQuery !== ""
  ].filter(Boolean).length;

  const filteredDemands = demands.filter(d => {
    if (!demandsSearchQuery) return true;
    const query = demandsSearchQuery.toLowerCase();
    return (
      d.title?.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query) ||
      d.buyerName?.toLowerCase().includes(query) ||
      d.category?.toLowerCase().includes(query)
    );
  });

  if (viewMode === "landing") {
    return (
      <>
        <LandingPage
          onEnterMarketplace={() => setViewMode("marketplace")}
          onEnterLogin={() => setIsLoginOpen(true)}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          currentUserAvatar={getAvatarPhoto(currentUserAvatar)}
          onLogout={handleLogout}
          onShowTerms={() => setShowGlobalTerms(true)}
          listingsCount={listings.length}
          listings={listings}
          currency={selectedCurrency}
          favorites={favorites}
          isProUser={isProUser}
          onToggleFavorite={(id) => {
            if (favorites.includes(id)) {
              setFavorites(prev => prev.filter(item => item !== id));
            } else {
              setFavorites(prev => [...prev, id]);
            }
          }}
          onOpenListingDetails={(listing) => {
            setActiveListing(listing);
            setViewMode("marketplace");
          }}
        />
        
        {/* Global Terms Dialog */}
        <AnimatePresence>
          {showGlobalTerms && (
            <div className="fixed inset-0 z-55 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] text-left"
              >
                <div className="flex justify-between items-center pb-3 border-b border-stone-100 flex-shrink-0">
                  <h3 className="font-serif text-lg font-bold text-stone-950">Conditions Générales d'Utilisation</h3>
                  <button onClick={() => setShowGlobalTerms(false)} className="p-1 text-stone-405 hover:text-stone-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-stone-600 leading-relaxed font-sans">
                  <p className="font-medium text-stone-850">Bienvenue sur La Brocante ! Notre but est de réinventer l'accès au marché de gré à gré citoyen.</p>
                  
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-stone-950 text-xs">1. Nature citoyenne et locale</h4>
                    <p>La Brocante met en relation directe des vendeurs et des acheteurs locaux. Nous recommandons vivement d’éviter les intermédiaires de paiement en effectuant vos transactions en mains propres.</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-stone-950 text-xs">2. Frais et Commission</h4>
                    <p>La Brocante ne retient absolument aucune commission. L’inscription, le dépôt de petites annonces et l’utilisation de la messagerie instantanée sont intégralement gratuits.</p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-stone-950 text-xs">3. Médias (Images et vidéos de démonstration)</h4>
                    <p>Les vendeurs s’engagent à ne publier que des médias authentiques représentant fidèlement l'état réel de leurs objets. Tout contenu offensant, hétérogène ou commercial trompeur sera épuré par notre modération locale.</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-stone-950 text-xs">4. Pratiques de Sécurité</h4>
                    <p>Pensez toujours à vous donner rendez-vous dans des endroits publics fréquentés (commerces, gares, centres-villes) pour parfaire votre transaction en toute sécurité.</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex justify-end flex-shrink-0">
                  <button
                    onClick={() => setShowGlobalTerms(false)}
                    className="bg-stone-900 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-stone-800 cursor-pointer"
                  >
                    J'ai compris et j'accepte
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {isLoginOpen && (
            <LoginPage
              onSuccess={(email, name, avatar, token) => {
                const lowerEmail = email.toLowerCase();
                // Ensure new or logging accounts don't directly get PRO status unless paid
                const proKey = `brocante_pro_${lowerEmail}`;
                if (localStorage.getItem(proKey) === null) {
                  localStorage.setItem(proKey, "false");
                }
                setCurrentUserEmail(email);
                setCurrentUserName(name);
                if (avatar) setCurrentUserAvatar(avatar);
                if (token) setSessionToken(token);
                setIsLoginOpen(false);
                setViewMode("marketplace");
              }}
              onClose={() => setIsLoginOpen(false)}
              initialEmail={currentUserEmail}
            />
          )}

          {isAccountModalOpen && (
            <AccountManagementModal
              key="account-modal-landing"
              isOpen={isAccountModalOpen}
              onClose={() => setIsAccountModalOpen(false)}
              currentUserEmail={currentUserEmail}
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
              setCurrentUserEmail={(email) => {
                if (!email) {
                  handleLogout();
                } else {
                  setCurrentUserEmail(email);
                }
              }}
              setCurrentUserName={setCurrentUserName}
              setCurrentUserAvatar={setCurrentUserAvatar}
              simulatedAccounts={simulatedAccounts}
              setSimulatedAccounts={setSimulatedAccounts}
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              listings={listings}
              favorites={favorites}
              setFavorites={setFavorites}
              onRefreshListings={fetchListings}
              isProUser={isProUser}
              onOpenUpgradeModal={() => setIsPremiumModalOpen(true)}
              onOpenLogin={() => {
                setIsAccountModalOpen(false);
                setIsLoginOpen(true);
              }}
            />
          )}
          {currentUserEmail && (
            <div 
              className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-52 w-auto px-4 max-w-[95vw] transition-all duration-300 ease-in-out ${
                isNavVisible && !shouldHideNav ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
              }`}
            >
              <ExpandableTabs
                tabs={[
                  { 
                    title: "Accueil", 
                    icon: Home,
                    className: "border border-solid",
                    style: { borderColor: "#ea9b66", color: "#d2783c" }
                  },
                  { 
                    title: "Marché", 
                    icon: ShoppingBag,
                    className: "border border-solid",
                    style: { color: "#d2783c", borderColor: "#b35627", backgroundColor: "#251e1e" },
                    iconStyle: { color: "#d2783c" },
                    spanStyle: { color: "#c2581f" }
                  },
                  { 
                    title: "Notifications" + (notifications.filter(n => !n.read).length > 0 ? ` (${notifications.filter(n => !n.read).length})` : ""), 
                    icon: Bell,
                    className: "border border-solid",
                    style: { borderColor: "#d2783c" },
                    iconStyle: { color: "#d2783c" }
                  },
                  { 
                    title: "Avis de Recherche" + (demands.length > 0 ? ` (${demands.length})` : ""), 
                    icon: Megaphone,
                    className: "border border-solid",
                    style: { borderColor: "#d2783c" },
                    iconStyle: { color: "#d2783c" }
                  },
                  { type: "separator" as const },
                  { 
                    title: "Mon Espace", 
                    icon: SlidersHorizontal,
                    className: "border border-solid",
                    style: { borderColor: "#d2783c" },
                    iconStyle: { color: "#d2783c" }
                  },
                  { 
                    title: "Messagerie" + (totalUnreadSim > 0 ? ` (${totalUnreadSim})` : ""), 
                    icon: MessageCircle,
                    style: { color: "#d2783c" }
                  },
                ]}
                selected={getViewIndex()}
                onChange={handleTabChange}
                activeColor="text-amber-500"
                className="border-stone-200/80 bg-white/95 dark:border-stone-850 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl shrink-0 flex items-center justify-center"
                style={{ color: "#d2783c" }}
              />
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div 
      id="app-root-scroll-container"
      className={`${viewMode === "messages" ? "fixed inset-0 overflow-hidden" : "fixed inset-0 overflow-y-auto pb-32 sm:pb-36"} flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode ? "bg-stone-950 text-stone-50" : "bg-[#fcfbf9] text-stone-900"
      }`}
    >
      
      {/* Global Modals for Marketplace context too */}
      <AnimatePresence>
        {isLoginOpen && (
          <LoginPage
            onSuccess={(email, name, avatar, token) => {
              const lowerEmail = email.toLowerCase();
              // Ensure new or logging accounts don't directly get PRO status unless paid
              const proKey = `brocante_pro_${lowerEmail}`;
              if (localStorage.getItem(proKey) === null) {
                localStorage.setItem(proKey, "false");
              }
              setCurrentUserEmail(email);
              setCurrentUserName(name);
              if (avatar) setCurrentUserAvatar(avatar);
              if (token) setSessionToken(token);
              setIsLoginOpen(false);
            }}
            onClose={() => setIsLoginOpen(false)}
            initialEmail={currentUserEmail}
          />
        )}
        {showGlobalTerms && (
          <div className="fixed inset-0 z-55 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] text-left"
            >
              <div className="flex justify-between items-center pb-3 border-b border-stone-100 flex-shrink-0">
                <h3 className="font-serif text-lg font-bold text-stone-950">Conditions Générales d'Utilisation</h3>
                <button onClick={() => setShowGlobalTerms(false)} className="p-1 text-stone-400 hover:text-stone-850">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-stone-600 leading-relaxed font-sans">
                <p className="font-medium text-stone-850">Bienvenue sur La Brocante ! Notre but est de réinventer l'accès au marché de gré à gré citoyen.</p>
                
                <div className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs">1. Nature citoyenne et locale</h4>
                  <p>La Brocante met en relation directe des vendeurs et des acheteurs locaux. Nous recommandons vivement d’éviter les intermédiaires de paiement en effectuant vos transactions en mains propres.</p>
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs">2. Frais et Commission</h4>
                  <p>La Brocante ne retient absolument aucune commission. L’inscription, le dépôt de petites annonces et l’utilisation de la messagerie instantanée sont intégralement gratuits.</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs">3. Médias (Images et vidéos de démonstration)</h4>
                  <p>Les vendeurs s’engagent à ne publier que des médias authentiques représentant fidèlement l'état réel de leurs objets. Tout contenu offensant, haineux ou commercial trompeur sera épuré par notre modération locale.</p>
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs">4. Pratiques de Sécurité</h4>
                  <p>Pensez toujours à vous donner rendez-vous dans des endroits publics fréquentés (commerces, gares, centres-villes) pour parfaire votre transaction en toute sécurité.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setShowGlobalTerms(false)}
                  className="bg-stone-900 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-stone-800 cursor-pointer"
                >
                  J'ai compris et j'accepte
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS DIALOG (Thème, Avatar, etc.) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-md w-full rounded-3xl p-6 shadow-2xl border transition-colors duration-300 text-left space-y-6 ${
                isDarkMode ? "bg-stone-900 border-stone-800 text-white" : "bg-white border-stone-200 text-stone-900"
              }`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-stone-150/40">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-amber-500 stroke-[2.2px]" />
                  <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-50">Mon Profil</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Profile Block */}
              <div className="space-y-4">
                {/* Display Name Edit inside Profile settings */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold">
                    Nom d'utilisateur public
                  </label>
                  <input
                    type="text"
                    value={currentUserName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setCurrentUserName(newName);
                      localStorage.setItem("brocante_current_user_name", newName);
                      if (currentUserEmail) {
                        setSimulatedAccounts(prev => 
                          prev.map(item => item.email.toLowerCase() === currentUserEmail.toLowerCase() ? { ...item, name: newName } : item)
                        );
                      }
                    }}
                    placeholder="Votre nom"
                    className="w-full px-3.5 py-2.5 text-xs border border-stone-200 dark:border-stone-750 rounded-xl bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-bold tracking-tight focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden shadow-2xs"
                  />
                  {currentUserEmail && (
                    <p className="text-[10px] text-stone-400 font-mono">Mail lié : {currentUserEmail}</p>
                  )}
                </div>

                {/* Re-organized custom photo / uploader design */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-extrabold">
                    Photo de profil (Avatar Actuel)
                  </label>
                  
                  <div className="flex flex-col items-center gap-4 p-4.5 rounded-2xl border border-stone-150 dark:border-stone-850 bg-stone-50 dark:bg-stone-950/40">
                    <div className="relative">
                      <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-amber-500/80 shadow-md flex items-center justify-center bg-stone-100 dark:bg-stone-900 shrink-0">
                        <img
                          src={getAvatarPhoto(currentUserAvatar)}
                          alt="Gérer mon portrait de profil"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs leading-none">
                        PROFIL
                      </span>
                      {isProUser && (
                        <ProBadge size="sm" className="absolute -top-1 -right-1" />
                      )}
                    </div>
                    
                    <div className="w-full space-y-3 pt-3 border-t border-dashed border-stone-200 dark:border-stone-800 text-[11px]">
                      {/* Local File Selector */}
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">Télécharger votre propre photo :</span>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full py-3 px-4 border-2 border-stone-300/60 dark:border-stone-700 border-dashed rounded-xl cursor-pointer bg-white dark:bg-stone-900 hover:bg-stone-100/50 dark:hover:bg-stone-850 hover:border-stone-400 transition-all text-center">
                            <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                              📁 Parcourir et choisir une image...
                            </span>
                            <span className="text-[8px] text-stone-400 block mt-0.5">Formats acceptés : PNG, JPG, WEBP</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === "string") {
                                      const url = reader.result;
                                      setCurrentUserAvatar(url);
                                      localStorage.setItem("brocante_current_user_avatar", url);
                                      if (currentUserEmail) {
                                        setSimulatedAccounts(prev => 
                                          prev.map(item => item.email.toLowerCase() === currentUserEmail.toLowerCase() ? { ...item, avatar: url } : item)
                                        );
                                      }
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* URL direct address */}
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">Ou indiquer l'adresse URL d'une photo :</span>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/votre_portrait..."
                          value={currentUserAvatar.startsWith("data:") ? "" : currentUserAvatar}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val.startsWith("http") || val.startsWith("data:")) {
                              setCurrentUserAvatar(val);
                              localStorage.setItem("brocante_current_user_avatar", val);
                              if (currentUserEmail) {
                                setSimulatedAccounts(prev => 
                                  prev.map(item => item.email.toLowerCase() === currentUserEmail.toLowerCase() ? { ...item, avatar: val } : item)
                                );
                              }
                            }
                          }}
                          className="w-full text-[10px] px-3 py-2 border border-stone-200 dark:border-stone-750 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-305 font-mono focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-150/40 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md text-xs"
                >
                  Confirmer et Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* HEADER BAR */}
      <header className={`sticky top-0 z-40 border-b shadow-3xs px-4 py-3.5 transition-all duration-300 ${
        isDarkMode ? "bg-stone-900/95 border-stone-800 text-white backdrop-blur-xs shadow-md" : "bg-white border-stone-200/80 text-stone-900"
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Menu Icon and Title Brand (same row/level) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl hover:bg-stone-100 text-stone-750 hover:text-stone-950 transition-all border border-stone-200 focus:outline-hidden cursor-pointer"
              title="Ouvrir le menu de navigation"
              id="sidebar-toggle-btn"
            >
              <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2px]" />
            </button>

            <div 
              onClick={() => setViewMode("landing")}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
              title="Retour à l'accueil"
            >
              <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 stroke-[2px]" />
              </div>
              <div className="hidden min-[380px]:block">
                <h1 className="font-serif text-sm sm:text-lg font-bold tracking-tight text-stone-900 leading-none group-hover:text-amber-800 transition-colors">
                  La Brocante
                </h1>
                <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mt-1 flex items-center gap-1 group-hover:text-amber-600">
                  <span>Le Marché Public</span>
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Control & Quick user configuration */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            
            {/* Dynamic Currency Selector (Devises Dropdown) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="p-2 sm:p-2.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors flex items-center justify-center focus:outline-hidden cursor-pointer relative"
                title={`Devise active : ${selectedCurrency.label}`}
              >
                <Coins className="w-5 h-5 text-amber-500 stroke-[2px]" />
                <span className="absolute -bottom-1 -right-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-mono text-[8px] px-1 font-extrabold rounded-sm shadow-xs border border-stone-150/10 dark:border-stone-800/10">
                  {selectedCurrency.symbol}
                </span>
              </button>

              <AnimatePresence>
                {showCurrencyDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCurrencyDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-3 z-50 text-left"
                    >
                      <h4 className="text-[9px] font-mono text-stone-400 dark:text-stone-550 uppercase tracking-widest mb-2 px-1 font-bold">
                        Devises de la Brocante
                      </h4>
                      <div className="space-y-1">
                        {CURRENCIES.map((curr) => (
                          <button
                            key={curr.code}
                            type="button"
                            onClick={() => {
                              setSelectedCurrency(curr);
                              setShowCurrencyDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 text-xs rounded-xl transition-colors flex items-center justify-between ${
                              curr.code === selectedCurrency.code
                                ? "bg-amber-100/70 text-amber-950 font-bold dark:bg-amber-950/35 dark:text-amber-400"
                                : "text-stone-750 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-850"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-stone-900 dark:text-white">{curr.label}</span>
                              <span className="text-[9px] text-stone-400 dark:text-stone-550 font-mono">1 € = {curr.rate} {curr.symbol}</span>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-500">{curr.symbol}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Unified Profile Action Circular Button */}
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="p-1 relative rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-hidden cursor-pointer shrink-0"
              title="Gérer mon compte & profils simulés"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-300 dark:border-amber-600/30 bg-[#fcd462] flex items-center justify-center shadow-3xs hover:brightness-105 transition-all text-stone-950 shrink-0">
                {currentUserEmail ? (
                  <img
                    src={getAvatarPhoto(currentUserAvatar)}
                    alt={currentUserName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-serif font-black text-sm">?</span>
                )}
              </div>
              {currentUserEmail && isProUser && (
                <ProBadge size="sm" className="absolute bottom-0.5 right-0.5" />
              )}
            </button>

            {/* DEMANDE D'ACHAT (Product search & post ad) */}
            <button
              id="header-demand-button"
              onClick={() => {
                if (!currentUserEmail) {
                  setIsLoginOpen(true);
                } else {
                  setIsDemandModalOpen(true);
                }
              }}
              title="Publier un avis de recherche / demande d'achat"
              className="text-white hover:opacity-95 text-xs font-bold p-2.5 sm:py-2.5 sm:px-3.5 rounded-xl shadow-xs transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0 animate-fadeIn"
              style={{ backgroundColor: '#e56f1e' }}
            >
              <Search className="w-4 h-4 text-white stroke-[2.5px] shrink-0" />
              <span className="hidden sm:inline">Avis de Recherche</span>
            </button>

            {/* VENDRE UN ARTICLE (The primary listing creation anchor) */}
            <button
              onClick={handleOpenCreateListing}
              className="text-white hover:opacity-95 text-xs font-bold p-2.5 sm:py-2.5 sm:px-4 rounded-xl shadow-xs transition-opacity cursor-pointer flex items-center gap-1.5 shrink-0"
              style={{ backgroundColor: '#e56f1e' }}
            >
              <Plus className="w-4 h-4 stroke-[2.5px] shrink-0" />
              <span className="hidden sm:inline">Vendre</span>
            </button>
          </div>
        </div>
      </header>

      {/* CORE MARKETPLACE BODY */}
      <main className={`max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0 ${viewMode === "messages" ? "p-0 sm:px-4 sm:pt-6 gap-0 sm:gap-6 h-[calc(100vh-68px)] max-h-[calc(100vh-68px)] sm:h-[calc(100vh-80px)] sm:max-h-[calc(100vh-80px)] overflow-hidden" : "px-3 sm:px-4 pt-4 sm:pt-6 gap-4 sm:gap-6"}`}>

        {/* TOP SEARCH BAR CONTAINER WITH SYNCHRONIZED REAL-TIME INFO */}
        {viewMode === "marketplace" && (
          <div className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-250 dark:border-stone-800 shadow-xs p-3.5 sm:p-4 flex flex-col gap-2.5">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-amber-500 stroke-[2.5px]" />
                <input
                  type="text"
                  placeholder="Que recherchez-vous aujourd'hui ? (Ex: Vélo, canapé, veste...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-stone-200 dark:border-stone-850 rounded-xl pl-11 pr-10 py-3 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100/50 dark:hover:bg-stone-900 focus:bg-stone-50 dark:focus:bg-stone-950 font-medium transition-colors focus:border-stone-900 dark:focus:border-stone-300 dark:text-white dark:placeholder-stone-500 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-3.5 text-stone-400 hover:text-stone-700 bg-stone-200/50 dark:bg-stone-800 hover:bg-stone-200 p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 md:flex-initial min-w-[130px] ${
                    showMobileFilters || activeFiltersCount > 0
                      ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 shrink-0" />
                  <span>{showMobileFilters ? "Masquer Filtres" : "Filtres avancés"}</span>
                  {activeFiltersCount > 0 && (
                    <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                      showMobileFilters || activeFiltersCount > 0 ? "bg-white text-amber-900" : "bg-amber-100 text-amber-950"
                    }`}>
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ASSOCIATED ANNOUNCEMENTS COUNT AND SYNCHRONIZED REAL-TIME MATCH PREVIEW */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-stone-100 mt-1 dark:border-stone-800">
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-sm" />
                <span>
                  <strong>{listings.length}</strong> annonce{listings.length > 1 ? "s" : ""} disponible{listings.length > 1 ? "s" : ""} actuellement
                </span>
              </div>
              
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 bg-stone-50/50 dark:bg-stone-850/20 px-2.5 py-1 rounded-lg border border-stone-100 dark:border-stone-800 max-w-full sm:max-w-md truncate">
                <span className="text-[9px] bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-95 shrink-0 select-none">
                  En Direct
                </span>
                <span className="truncate italic">
                  {searchQuery ? (
                    listings.length > 0 
                      ? `En direct : "${listings[0].title}" — ${formatPrice(listings[0].price, selectedCurrency)}`
                      : `Aucune correspondance en temps réel pour "${searchQuery}"`
                  ) : (
                    listings.length > 0
                      ? `Dernière annonce : "${listings[0].title}" — ${formatPrice(listings[0].price, selectedCurrency)}`
                      : "Prêt pour la synchronisation en direct"
                  )}
                </span>
              </div>
            </div>
          </div>
        )}



        {/* BUYER DEMANDS & ANNOUNCEMENTS BANNER (Beautifully streamlined and space-efficient space saving horizontal carousel) */}
        {viewMode === "marketplace" && demands.length > 0 && (
          <div id="root-demands-banner" className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-650 to-amber-600 border border-amber-500/30 text-white p-3.5 relative shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
                <h3 className="font-serif font-black uppercase tracking-tight text-xs sm:text-sm text-amber-100 flex items-center gap-1.5 leading-none mr-1">
                  <span>📢 Recherches Citoyennes d'Achat</span>
                  <span className="bg-black/40 text-[9px] font-mono font-bold text-amber-300 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {demands.length} en direct
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDemandInfoModal(true)}
                  className="p-1 rounded-full text-amber-250 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
                  title="En savoir plus sur les Recherches Citoyennes d'Achat"
                  aria-label="En savoir plus"
                >
                  <HelpCircle className="w-4 h-4 shrink-0" />
                </button>
              </div>
              <p className="text-[10px] font-medium font-mono text-white/80 hidden md:block">
                Vous possédez l'un de ces objets ? Contactez les voisins gratuitement !
              </p>
            </div>

            {/* Horizontal Scrollable Row for extreme screen space efficiency */}
            <div className="flex overflow-x-auto gap-3.5 pb-1.5 scrollbar-thin scrollbar-thumb-amber-700/60 scrollbar-track-transparent snap-x">
              {demands.map((demand, index) => (
                <div 
                  key={demand.id} 
                  className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200/95 dark:border-stone-800 rounded-xl p-2.5 flex gap-2.5 shadow-3xs hover:bg-stone-50 dark:hover:bg-stone-850/60 transition-colors relative overflow-hidden shrink-0 w-[285px] sm:w-[325px] snap-start"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 bg-stone-50 dark:bg-stone-950 rounded-lg overflow-hidden shrink-0 border border-stone-150 dark:border-stone-800">
                    <img 
                      src={demand.imageUrl} 
                      className="w-full h-full object-cover" 
                      alt={demand.title}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-extrabold text-xs text-black dark:text-white truncate leading-tight">{demand.title}</h4>
                        <span className="bg-amber-105 dark:bg-stone-950 text-amber-950 dark:text-amber-400 font-mono font-black text-[9px] px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-stone-800 shrink-0">
                          {formatPrice(demand.desiredPrice, selectedCurrency)}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5 leading-tight">
                        {demand.description || "Recherche de seconde main urgente de cet article."}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-1 font-mono text-[8px] font-bold">
                        <span className="bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 px-1 py-0.5 border border-stone-150 dark:border-stone-800 rounded">
                          Qté: {demand.quantity}
                        </span>
                        {demand.size && demand.size !== "N/A" && (
                          <span className="bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 px-1 py-0.5 border border-stone-150 dark:border-stone-800 rounded max-w-[70px] truncate">
                            T: {demand.size}
                          </span>
                        )}
                        {demand.color && demand.color !== "N/A" && (
                          <span className="bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300 px-1 py-0.5 border border-stone-150 dark:border-stone-800 rounded max-w-[70px] truncate">
                            Coul: {demand.color}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1.5 mt-1.5 border-t border-dashed border-stone-150 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => setSelectedUserProfile({ name: demand.buyerName, email: demand.buyerEmail })}
                        className="text-[9px] font-mono text-stone-400 dark:text-stone-500 truncate hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0"
                        title="Voir le profil de l'auteur"
                      >
                        <span>Par:</span>
                        <strong className="text-stone-605 dark:text-stone-300 hover:underline font-bold">{demand.buyerName}</strong>
                      </button>
                      {(!currentUserEmail || currentUserEmail.toLowerCase() !== demand.buyerEmail.toLowerCase()) ? (
                        <button
                          onClick={() => handleContactBuyer(demand)}
                          className="px-2 py-1 bg-stone-900 dark:bg-stone-800 hover:bg-amber-600 dark:hover:bg-amber-600 text-white font-mono font-bold text-[9px] rounded-md shadow-3xs cursor-pointer transition-all flex items-center gap-1 shrink-0 border-0"
                          title="Proposer mon objet à cet acheteur"
                        >
                          <span>Lui proposer</span>
                        </button>
                      ) : (
                        <span className="text-[8px] font-bold text-amber-600 font-mono italic">Ma demande</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BROWSE GRID SECTION WITH INTEGRATED FILTER RAIL */}
        {viewMode === "marketplace" ? (
          <div className="w-full space-y-4">

            {/* Display active filter pill summary on all viewports */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center p-3 bg-amber-50/25 rounded-xl border border-amber-150/40">
                <span className="text-[10px] font-mono uppercase text-stone-500 font-bold mr-1">Filtres actifs :</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-white text-stone-850 text-[10px] font-medium px-2 py-1 rounded-lg border border-stone-200">
                    Mot: "{searchQuery}"
                  </span>
                )}
                {selectedCategory !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 bg-white text-stone-850 text-[10px] font-medium px-2 py-1 rounded-lg border border-stone-200">
                    Catégorie: {selectedCategory}
                  </span>
                )}
                {selectedCondition !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 bg-white text-stone-850 text-[10px] font-medium px-2 py-1 rounded-lg border border-stone-200">
                    État: {selectedCondition}
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 bg-white text-stone-850 text-[10px] font-medium px-2 py-1 rounded-lg border border-stone-200 font-mono">
                    Prix: {minPrice ? formatPrice(parseInt(minPrice), selectedCurrency) : formatPrice(0, selectedCurrency)} - {maxPrice ? formatPrice(parseInt(maxPrice), selectedCurrency) : "∞"}
                  </span>
                )}
                {locationQuery && (
                  <span className="inline-flex items-center gap-1 bg-white text-stone-850 text-[10px] font-medium px-2 py-1 rounded-lg border border-stone-200">
                    Ville: {locationQuery}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Toutes");
                    setSelectedCondition("Toutes");
                    setMinPrice("");
                    setMaxPrice("");
                    setLocationQuery("");
                  }}
                  className="text-[10px] text-amber-700 hover:underline font-mono ml-auto font-bold cursor-pointer"
                >
                  Tout effacer
                </button>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 items-start pt-2">

          {/* SIDEBAR: FILTER WORKSPACE (Always static and beautifully integrated for desktop) */}
          <aside className="hidden lg:block w-64 bg-white border border-stone-200 rounded-2xl p-4 shrink-0 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700">
                <SlidersHorizontal className="w-4 h-4 text-stone-500" />
                <span>Recherche & Filtres</span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Toutes");
                  setSelectedCondition("Toutes");
                  setMinPrice("");
                  setMaxPrice("");
                  setLocationQuery("");
                }}
                className="text-[10px] text-stone-400 hover:text-amber-700 font-mono underline cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>

            {/* Keyword search input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                Mot Clé
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Vélo, canapé, PS4..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-xl pl-8.5 pr-3 py-2.5 focus:outline-hidden focus:border-stone-900 bg-[#fafafa]"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              </div>
            </div>

            {/* Category Filter list */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                Catégories
              </label>
              <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center justify-between ${
                      selectedCategory === cat
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price inputs min/max */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                Prix ({selectedCurrency.symbol})
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-[#fafafa] font-mono text-center"
                />
                <span className="text-stone-300 font-mono">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-[#fafafa] font-mono text-center"
                />
              </div>
            </div>

            {/* Location Query */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                Localisation (Ville)
              </label>
              <input
                type="text"
                placeholder="Ex: Paris, Lyon..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-[#fafafa]"
              />
            </div>

            {/* Condition Query */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                État de conservation
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-[#fafafa]"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order select box */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-[#fafafa]"
              >
                <option value="newest">Annonces récentes</option>
                <option value="priceAsc">Prix croissant</option>
                <option value="priceDesc">Prix décroissant</option>
              </select>
            </div>

            <button
              onClick={fetchListings}
              className="w-full bg-stone-900 hover:bg-stone-800 text-amber-100 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rafraîchir la recherche</span>
            </button>
          </aside>

          {/* DYNAMIC DRAWERS: MOBILE FILTER OVERLAY */}
          <AnimatePresence>
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center">
                {/* Backdrop with elegant fade-in */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileFilters(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                />
                
                {/* Drawer sliding up from the bottom */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 240 }}
                  className="w-full max-h-[85vh] bg-white rounded-t-3xl shadow-xl flex flex-col overflow-hidden relative z-10 border-t-2 border-amber-600"
                >
                  {/* Handle indicator */}
                  <div className="p-3 pb-0 bg-white z-20 shrink-0">
                    <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto" />
                  </div>

                  {/* Drawer Header */}
                  <div className="px-4.5 pb-3 pt-1 border-b border-stone-100 flex items-center justify-between bg-white z-20 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-900">
                      <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                      <span>Recherche & Filtres</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1.5 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Drawer body container (fully scrollable, beautiful density layout) */}
                  <div className="flex-1 overflow-y-auto p-4.5 space-y-4 font-sans text-stone-800">
                    {/* Active summary */}
                    <div className="flex justify-between items-center bg-amber-50/40 p-2.5 rounded-xl border border-amber-100 flex-row">
                      <span className="text-[10px] font-mono font-bold text-amber-900 uppercase">Filtres Actifs : {activeFiltersCount}</span>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("Toutes");
                          setSelectedCondition("Toutes");
                          setMinPrice("");
                          setMaxPrice("");
                          setLocationQuery("");
                        }}
                        className="text-[10.5px] text-amber-700 font-mono font-bold hover:underline"
                      >
                        Tout réinitialiser
                      </button>
                    </div>

                    {/* Mobile Keyword search */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                        Mot Clé
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: canapé, sweat, LEGO..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs border border-stone-200 rounded-xl pl-8.5 pr-3 py-2.5 focus:outline-hidden focus:border-stone-900 bg-stone-50"
                        />
                        <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      </div>
                    </div>

                    {/* Mobile Categories Layout of a gorgeous responsive grid */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                        Catégories
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`text-left text-xs px-2.5 py-2 rounded-lg transition-colors font-medium flex items-center justify-between ${
                              selectedCategory === cat
                                ? "bg-stone-900 text-white"
                                : "text-stone-600 bg-stone-50 border border-stone-150 hover:bg-stone-100"
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Price */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                        Prix ({selectedCurrency.symbol})
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-mono text-center"
                        />
                        <span className="text-stone-300 font-mono">—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-mono text-center"
                        />
                      </div>
                    </div>

                    {/* Mobile Location */}
                    <div className="space-y-1.5 border-t border-stone-100 pt-3">
                      <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                        Ville / Code Postal
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Paris, Lyon, Toulouse..."
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-stone-50"
                      />
                    </div>

                    {/* Mobile Condition */}
                    <div className="grid grid-cols-2 gap-3 pb-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                          État de l'objet
                        </label>
                        <select
                          value={selectedCondition}
                          onChange={(e) => setSelectedCondition(e.target.value)}
                          className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-stone-50"
                        >
                          {CONDITIONS.map((cond) => (
                            <option key={cond} value={cond}>
                              {cond}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                          Trier par
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full text-xs border border-stone-200 rounded-xl p-2.5 bg-stone-50"
                        >
                          <option value="newest">Récent</option>
                          <option value="priceAsc">Prix croissant</option>
                          <option value="priceDesc">Prix décroissant</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Drawer Bottom buttons */}
                  <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 sticky bottom-0 z-20 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("Toutes");
                        setSelectedCondition("Toutes");
                        setMinPrice("");
                        setMaxPrice("");
                        setLocationQuery("");
                        fetchListings();
                      }}
                      className="flex-1 py-3 text-xs font-semibold text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all"
                    >
                      Effacer tout
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fetchListings();
                        setShowMobileFilters(false);
                      }}
                      className="flex-1 py-3 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Appliquer ({listings.length})</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MAIN COLUMN: LISTINGS GRID AND SORT COUNTER */}
          <div className="flex-1 w-full space-y-4">
            
            {/* Horizontal Grid Info head */}
            <div className="flex items-center justify-between text-xs text-stone-500 bg-white border border-stone-200 p-4 rounded-2xl flex-row">
              <div>
                <span>Vous visualisez <strong>{listings.length}</strong> annonce{listings.length > 1 ? "s" : ""} correspondante{listings.length > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase text-stone-400">Synchronisé en direct</span>
              </div>
            </div>

            {/* Main Listings Grid */}
            {loadingListings ? (
              <div className="py-24 text-center">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-mono">Chargement des annonces en temps réel...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white border text-center p-12 rounded-3xl min-h-[350px] flex flex-col justify-center items-center">
                <ShoppingBag className="w-12 h-12 text-stone-300 stroke-[1.2px] mb-3" />
                <h3 className="font-serif text-lg font-bold text-stone-800">Aucune annonce trouvée</h3>
                <p className="text-xs text-stone-500 max-w-[340px] mt-1.5 leading-relaxed">
                  Aucun article ne correspond à vos filtres de recherche. Essayez d'élargir la catégorie ou d'effacer vos saisies de prix.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Toutes");
                    setSelectedCondition("Toutes");
                    setMinPrice("");
                    setMaxPrice("");
                    setLocationQuery("");
                  }}
                  className="mt-4 bg-stone-900 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-colors hover:bg-stone-800"
                >
                  Effacer tous les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5">
                {listings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onClick={() => setActiveListing(item)}
                    currency={selectedCurrency}
                    isFavorited={favorites.includes(item.id)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      if (favorites.includes(item.id)) {
                        setFavorites(prev => prev.filter(id => id !== item.id));
                      } else {
                        setFavorites(prev => [...prev, item.id]);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
        ) : viewMode === "notifications" ? (
          <NotificationCenter
            notifications={notifications}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onToggleRead={handleToggleNotificationRead}
            onClearNotification={handleClearNotification}
            onClearAll={handleClearAllNotifications}
            isDarkMode={isDarkMode}
            onBackToMarketplace={() => setViewMode("marketplace")}
          />
        ) : viewMode === "demands" ? (
          <div className="w-full space-y-6 flex flex-col min-h-0">
            {/* HERO / HEADER SECTION FOR DEMANDS */}
            <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 overflow-hidden relative shadow-md">
              <div className="space-y-2 z-10 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-white/10 hover:bg-white/15 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold">
                    📢 Avis de Recherche
                  </span>
                  <span className="bg-white/10 text-stone-300 px-2.5 py-0.5 rounded-full text-[9px] font-mono">
                    Acheter & Trouver
                  </span>
                </div>
                <h2 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-white m-0">
                  Objets Recherchés & Avis de Recherche
                </h2>
                <p className="text-stone-300 text-[11px] sm:text-xs leading-normal max-w-2xl m-0">
                  Découvrez ce que recherchent activement les habitants de votre voisinage ! Si vous possédez l'un de ces objets de seconde main, proposez-leur directement sans aucun frais.
                </p>
              </div>

              {/* ACTION CALL BUTTON */}
              <div className="flex flex-col justify-center shrink-0 z-10">
                <button
                  onClick={() => {
                    if (!currentUserEmail) {
                      setIsLoginOpen(true);
                    } else {
                      setIsDemandModalOpen(true);
                    }
                  }}
                  className="px-5 py-3 text-stone-950 font-bold text-xs bg-[#fcd462] hover:bg-amber-400 transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95 border-0"
                >
                  <Plus className="w-4 h-4 text-stone-950 stroke-[2.5px]" />
                  <span>Publier ma recherche</span>
                </button>
              </div>
            </div>

            {/* REAL-TIME DYNAMIC SEARCH AND SYNCHRONIZED PREVIEW BAR */}
            <div className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 flex flex-col gap-3.5 text-left">
              <div className="relative w-full">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-amber-500 stroke-[2.5px]" />
                <input
                  type="text"
                  placeholder="Rechercher parmi les demandes d'achat en cours... (ex: table, veste, livre)"
                  value={demandsSearchQuery}
                  onChange={(e) => setDemandsSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-stone-200 dark:border-stone-850 rounded-xl pl-11 pr-10 py-3 bg-stone-50 dark:bg-stone-950 hover:bg-stone-100/50 dark:hover:bg-stone-900 focus:bg-stone-100 dark:focus:bg-stone-900 focus:outline-hidden dark:text-white dark:placeholder-stone-500 font-medium transition-colors focus:border-stone-900 dark:focus:border-stone-300"
                />
                {demandsSearchQuery && (
                  <button
                    onClick={() => setDemandsSearchQuery("")}
                    className="absolute right-4 top-3.5 text-stone-400 hover:text-stone-700 bg-stone-200/50 dark:bg-stone-800 hover:bg-stone-200 p-0.5 rounded-full cursor-pointer flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* SYNCHRONIZED REAL-TIME INFO ON THE LEVEL OF THE SEARCH BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>
                    <strong>{filteredDemands.length}</strong> recherche{filteredDemands.length > 1 ? "s" : ""} disponible{filteredDemands.length > 1 ? "s" : ""}
                  </span>
                </div>
                
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 bg-stone-50/50 dark:bg-stone-950/50 px-2.5 py-1 rounded-lg border border-stone-150 dark:border-stone-800 max-w-full sm:max-w-md truncate">
                  <span className="text-[9px] bg-amber-100 dark:bg-stone-950 text-amber-900 dark:text-amber-400 border dark:border-stone-850 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider scale-95 shrink-0 select-none">
                    Sync En Direct
                  </span>
                  <span className="truncate italic">
                    {demandsSearchQuery ? (
                      filteredDemands.length > 0 
                        ? `Aperçu match local : "${filteredDemands[0].title}" (${formatPrice(filteredDemands[0].desiredPrice, selectedCurrency)})`
                        : `Aucune correspondance active en temps réel pour "${demandsSearchQuery}"`
                    ) : (
                      demands.length > 0
                        ? `Dernière demande reçue : "${demands[0].title}" (${formatPrice(demands[0].desiredPrice, selectedCurrency)})`
                        : "Prêt pour la synchronisation des recherches citoyennes"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* DEMANDS LIST GRID */}
            {filteredDemands.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDemands.map((demand, index) => (
                  <div 
                    key={demand.id} 
                    className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-4 flex gap-4 shadow-xs hover:shadow-md hover:translate-y-[-2px] transition-all relative overflow-hidden text-left"
                  >
                    <div className="w-20 h-20 bg-stone-50 dark:bg-stone-950 rounded-xl overflow-hidden shrink-0 border border-stone-150 dark:border-stone-800">
                      <img 
                        src={demand.imageUrl} 
                        className="w-full h-full object-cover" 
                        alt={demand.title}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate m-0">{demand.title}</h4>
                          <span className="bg-amber-50 dark:bg-stone-950 text-amber-900 dark:text-amber-400 font-black text-xs px-2 py-0.5 rounded-lg border border-amber-100 dark:border-stone-800 shrink-0">
                            {formatPrice(demand.desiredPrice, selectedCurrency)}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-normal m-0">
                          {demand.description || "Recherche d'objet d'occasion pour achat immédiat ou reprise citoyenne."}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2 font-mono text-[9px] font-bold">
                          <span className="bg-stone-100 dark:bg-stone-955 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded-md border border-stone-150 dark:border-stone-800">
                            Qté: {demand.quantity}
                          </span>
                          {demand.size && demand.size !== "N/A" && (
                            <span className="bg-stone-100 dark:bg-stone-955 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded-md border border-stone-150 dark:border-stone-800 max-w-[80px] truncate">
                              Taille: {demand.size}
                            </span>
                          )}
                          {demand.color && demand.color !== "N/A" && (
                            <span className="bg-stone-100 dark:bg-stone-955 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded-md border border-stone-150 dark:border-stone-800 max-w-[80px] truncate">
                              Couleur: {demand.color}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-2.5 mt-3 border-t border-dashed border-stone-150 dark:border-stone-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedUserProfile({ name: demand.buyerName, email: demand.buyerEmail })}
                            className="text-[10px] text-stone-400 dark:text-stone-500 truncate hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0"
                            title="Voir le profil de l'auteur"
                          >
                            <span>Auteur:</span>
                            <strong className="text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-500 hover:underline font-bold">{demand.buyerName}</strong>
                          </button>
                          
                          {/* Share button */}
                          <button
                            type="button"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}${window.location.pathname}?demandId=${demand.id}`;
                              navigator.clipboard.writeText(shareUrl);
                              alert("Lien de partage de la demande copié !");
                            }}
                            className="p-1 text-stone-400 hover:text-[#d2783c] transition-colors rounded-md cursor-pointer shrink-0"
                            title="Partager cette demande d'achat"
                          >
                            <Link className="w-3 h-3" />
                          </button>
                        </div>

                        {(!currentUserEmail || currentUserEmail.toLowerCase() !== demand.buyerEmail.toLowerCase()) ? (
                          <button
                            onClick={() => handleContactBuyer(demand)}
                            className="px-3.5 py-1.5 bg-stone-900 dark:bg-stone-800 hover:bg-amber-600 dark:hover:bg-amber-600 border-0 text-white font-mono font-bold text-[10px] rounded-xl cursor-pointer transition-all shadow-3xs hover:scale-[1.03] active:scale-[0.97]"
                            title="Proposer mon objet à cet acheteur"
                          >
                            <span>Lui proposer</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-600 font-mono italic">Mon avis d'achat</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center flex flex-col items-center justify-center">
                <Megaphone className="w-12 h-12 text-stone-300 stroke-[1.2px] mb-3" />
                <h3 className="font-serif text-base font-bold text-stone-850 dark:text-white">Aucune demande correspondante</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1 mb-4">
                  Il n'y a pour le moment aucune recherche citoyenne d'achat correspondant à "{demandsSearchQuery}". Modifiez vos termes de recherche.
                </p>
                <button
                  onClick={() => setDemandsSearchQuery("")}
                  className="bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer border-0"
                >
                  Réinitialiser le terme
                </button>
              </div>
            )}
          </div>
        ) : viewMode === "messages" ? (
          <div className={`flex-1 min-h-0 h-full w-full sm:rounded-2xl overflow-hidden sm:border ${isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200 text-stone-900"} sm:shadow-md flex flex-col`}>
            {/* Header indicating it is the dedicated messaging view */}
            <div className={`px-4 py-3 border-b flex justify-between items-center flex-shrink-0 sm:rounded-t-2xl transition-colors ${
              isDarkMode 
                ? "bg-stone-900 border-stone-850 text-white" 
                : "bg-stone-50/50 border-stone-150 text-stone-900"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-stone-800 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2px] shrink-0" />
                </div>
                <div className="text-left">
                  <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider block leading-tight ${isDarkMode ? "text-amber-400" : "text-stone-800"}`}>
                    Messagerie Dédiée
                  </span>
                  <p className={`text-[9px] sm:text-[10px] font-mono truncate max-w-[140px] sm:max-w-[240px] leading-none mt-0.5 ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                    {currentUserEmail || "Non connecté"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewMode("marketplace")}
                className={`text-[10px] font-semibold py-1.5 px-3 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isDarkMode 
                    ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/50" 
                    : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-3xs"
                }`}
              >
                Retour au Marché
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col">
              {currentUserEmail ? (
                <DirectChat
                  currentUserEmail={currentUserEmail}
                  currentUserName={currentUserName}
                  threads={threads}
                  activeThreadId={activeThreadId}
                  onSelectThread={(id) => setActiveThreadId(id)}
                  onSendMessage={handleSendMessage}
                  onRefresh={handleRefreshChatsAndListings}
                  isDarkMode={isDarkMode}
                  initialInputText={chatInputToInject || undefined}
                  onInputInjected={() => setChatInputToInject(null)}
                  listings={listings}
                  isProUser={isProUser}
                  onUpgradePro={() => {
                    setIsPremiumModalOpen(true);
                  }}
                  currency={selectedCurrency}
                  onAddNotification={handleAddNotification}
                  onNavigateToNotifications={() => setViewMode("notifications")}
                  sessionToken={sessionToken}
                />
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <MessageCircle className="w-12 h-12 text-stone-300 stroke-[1.2px] mb-3" />
                  <h3 className="font-serif text-base font-bold text-stone-800">Messagerie non disponible</h3>
                  <p className="text-xs text-stone-500 max-w-[260px] mt-1.5 mb-4 leading-relaxed">
                    S'il vous plaît, connectez-vous ou simulez un email pour démarrer des chats de négociation.
                  </p>
                  <button
                    onClick={() => {
                      setIsLoginOpen(true);
                    }}
                    className="bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    Se connecter
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === "admin" ? (
          <AdminDashboard
            adminEmail={currentUserEmail}
            currency={selectedCurrency}
            onBackToApp={() => setViewMode("marketplace")}
          />
        ) : (
          <SellerDashboard
            currentUserEmail={currentUserEmail}
            currentUserName={currentUserName}
            listings={listings}
            threads={threads}
            currency={selectedCurrency}
            onEditListing={handleEditListing}
            onToggleSold={handleToggleSold}
            onDeleteListing={handleDeleteListing}
            onOpenListingDetails={(listing) => setActiveListing(listing)}
            onBackToMarketplace={() => setViewMode("marketplace")}
            onOpenCreateModal={handleOpenCreateListing}
            isProUser={isProUser}
            onOpenUpgradeModal={() => setIsPremiumModalOpen(true)}
            onGoToMessages={(threadId) => {
              setActiveThreadId(threadId);
              setViewMode("messages");
            }}
            categoriesList={CATEGORIES.filter(c => c !== "Toutes")}
            conditionsList={CONDITIONS.filter(c => c !== "Toutes")}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* --- ALL INJECTABLE MODAL DIALOGS --- */}
      <AnimatePresence>
        
        {/* Navigation Sidebar Drawer */}
        {isSidebarOpen && (
          <React.Fragment key="sidebar-drawer-fragment">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-stone-950 z-50 cursor-pointer"
            />
            {/* Sidebar content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 h-full w-full max-w-[280px] bg-white shadow-2xl border-r border-stone-200 z-50 flex flex-col p-5 space-y-6 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-150 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
                    <ShoppingBag className="w-4.5 h-4.5 text-amber-400 stroke-[2px]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-stone-900 leading-none">La Brocante</h3>
                    <span className="text-[8px] font-mono uppercase tracking-wider text-stone-400">Menu Réuni</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-850"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Actions */}
              <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Authenticated context user display & Consolidated Account Management Access (Placed at the top as requested) */}
                  <div>
                    <h4 className="text-[9px] font-mono text-stone-400 dark:text-stone-550 uppercase tracking-widest font-extrabold mb-2">Mon Compte</h4>
                    <div className="bg-stone-50 dark:bg-stone-850 border border-stone-150 dark:border-stone-800 rounded-xl p-3 flex flex-col items-center relative">
                      
                      {/* Prominent live counters placed at the top of this banner/announcement block */}
                      {(totalUnreadSim > 0 || notifications.filter(n => !n.read).length > 0) && (
                        <div className="absolute -top-2.5 right-2.5 flex gap-1 items-center z-10">
                          {totalUnreadSim > 0 && (
                            <span className="bg-amber-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1" title={`${totalUnreadSim} messages non lus`}>
                              <span>💬</span>
                              <span>{totalUnreadSim}</span>
                            </span>
                          )}
                          {notifications.filter(n => !n.read).length > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1" title={`${notifications.filter(n => !n.read).length} notifications`}>
                              <span>🔔</span>
                              <span>{notifications.filter(n => !n.read).length}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Interactive Profile Image / Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                        className="relative group transition-transform duration-200 active:scale-95 focus:outline-hidden cursor-pointer flex flex-col items-center"
                        title={isProfileExpanded ? "Masquer les détails du profil" : "Afficher les détails du profil"}
                      >
                        <div className="w-14 h-14 relative rounded-full overflow-hidden bg-[#fcd462] border-2 border-amber-400 dark:border-amber-600/50 shadow-sm flex items-center justify-center shrink-0">
                          {currentUserEmail ? (
                            <img
                              src={getAvatarPhoto(currentUserAvatar)}
                              alt={currentUserName}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-serif font-black text-lg">?</span>
                          )}
                        </div>
                        {currentUserEmail && isProUser && (
                          <ProBadge size="md" className="absolute top-0 right-0" />
                        )}
                        {/* Interactive mini badge cursor helper */}
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 font-mono text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-2xs group-hover:bg-amber-600 transition-colors uppercase leading-none">
                          {isProfileExpanded ? "▼" : "▲"}
                        </span>
                      </button>

                      {/* Expandable info block */}
                      <AnimatePresence>
                        {isProfileExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full overflow-hidden text-center mt-3.5 space-y-4"
                          >
                            {/* Profile details shown only when expanded, with editable name and avatar selectors */}
                            <div className="w-full px-1 space-y-2">
                              {currentUserEmail ? (
                                <div className="space-y-1">
                                  <label className="block text-[8px] font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest text-center">
                                    Nom d'affichage (cliquez pour modifier) :
                                  </label>
                                  <input
                                    type="text"
                                    value={currentUserName}
                                    onChange={(e) => {
                                      const newName = e.target.value;
                                      setCurrentUserName(newName);
                                      try {
                                        localStorage.setItem("brocante_current_user_name", newName);
                                        const updated = simulatedAccounts.map(acc => {
                                          if (acc.email.toLowerCase() === currentUserEmail.toLowerCase()) {
                                            return { ...acc, name: newName };
                                          }
                                          return acc;
                                        });
                                        setSimulatedAccounts(updated);
                                        localStorage.setItem("brocante_simulated_accounts", JSON.stringify(updated));
                                      } catch (err) {
                                        console.warn(err);
                                      }
                                    }}
                                    className="w-full text-center text-xs font-serif font-bold text-stone-900 dark:text-white bg-stone-100/50 dark:bg-stone-900/50 hover:bg-stone-200/50 dark:hover:bg-stone-850/50 focus:bg-white dark:focus:bg-stone-950 focus:ring-1 focus:ring-amber-500 px-1 py-1 rounded-lg transition-all outline-hidden border-none text-center"
                                  />
                                </div>
                              ) : (
                                <span className="font-serif font-bold text-stone-900 dark:text-white text-xs block truncate leading-tight mb-0.5 text-center font-bold">
                                  Mode Invité (Public)
                                </span>
                              )}
                              <span className="text-[9px] text-stone-400 dark:text-stone-550 block truncate font-mono text-center">
                                {currentUserEmail ? currentUserEmail : "Aucun compte connecté"}
                              </span>

                              {currentUserEmail && (
                                <div className="pt-2 border-t border-stone-150/45 dark:border-stone-800/65 space-y-1.5">
                                  <span className="block text-[8px] font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest text-center">
                                    Changer de photo :
                                  </span>
                                  <div className="flex items-center justify-center gap-1.5">
                                    {[
                                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
                                      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop",
                                      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop",
                                    ].map((url, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          setCurrentUserAvatar(url);
                                          try {
                                            localStorage.setItem("brocante_current_user_avatar", url);
                                            const updated = simulatedAccounts.map(acc => {
                                              if (acc.email.toLowerCase() === currentUserEmail.toLowerCase()) {
                                                return { ...acc, avatar: url };
                                              }
                                              return acc;
                                            });
                                            setSimulatedAccounts(updated);
                                            localStorage.setItem("brocante_simulated_accounts", JSON.stringify(updated));
                                          } catch (err) {
                                            console.warn(err);
                                          }
                                        }}
                                        className={`w-5 h-5 rounded-full overflow-hidden border transition shrink-0 ${
                                          currentUserAvatar === url ? "border-amber-500 scale-110 ring-2 ring-amber-500/20" : "border-stone-200 hover:border-amber-400"
                                        }`}
                                      >
                                        <img src={url} alt="preset" className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                    <label className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-850 border border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-400 transition flex items-center justify-center cursor-pointer shrink-0" title="Uploader une photo">
                                      <span className="text-[10px] font-bold text-stone-500">+</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              if (typeof reader.result === "string") {
                                                const uploadedUrl = reader.result;
                                                setCurrentUserAvatar(uploadedUrl);
                                                try {
                                                  localStorage.setItem("brocante_current_user_avatar", uploadedUrl);
                                                  const updated = simulatedAccounts.map(acc => {
                                                    if (acc.email.toLowerCase() === currentUserEmail.toLowerCase()) {
                                                      return { ...acc, avatar: uploadedUrl };
                                                    }
                                                    return acc;
                                                  });
                                                  setSimulatedAccounts(updated);
                                                  localStorage.setItem("brocante_simulated_accounts", JSON.stringify(updated));
                                                } catch (err) {
                                                  console.warn(err);
                                                }
                                              }
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* COMPTES SIMULÉS (QUICK SWITCHER & CREATION) */}
                            <div className="text-left pt-3 border-t border-stone-150 dark:border-stone-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Comptes Simulés</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowNewAccountForm(!showNewAccountForm)}
                                  className="text-[10px] font-mono font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400 cursor-pointer"
                                >
                                  {showNewAccountForm ? "Annuler" : "+ Créer"}
                                </button>
                              </div>

                              {showNewAccountForm && (
                                <form
                                  onSubmit={async (e) => {
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
                                    
                                    try {
                                      await fetch("/api/users", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(newAcc)
                                      });
                                    } catch (err) {
                                      console.error("Erreur lors de l'enregistrement de l'utilisateur :", err);
                                    }

                                    const updated = [...simulatedAccounts, newAcc];
                                    setSimulatedAccounts(updated);
                                    try {
                                      localStorage.setItem("brocante_simulated_accounts", JSON.stringify(updated));
                                      localStorage.setItem("brocante_current_user_email", newAcc.email);
                                      localStorage.setItem("brocante_current_user_name", newAcc.name);
                                      localStorage.setItem("brocante_current_user_avatar", newAcc.avatar);
                                    } catch (err) {
                                      console.warn(err);
                                    }
                                    setCurrentUserEmail(newAcc.email);
                                    setCurrentUserName(newAcc.name);
                                    setCurrentUserAvatar(newAcc.avatar);
                                    
                                    setNewAccName("");
                                    setNewAccEmail("");
                                    setShowNewAccountForm(false);
                                  }}
                                  className="p-2.5 bg-stone-100/60 dark:bg-stone-900/45 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5"
                                >
                                  <input
                                    type="text"
                                    placeholder="Nom"
                                    value={newAccName}
                                    onChange={(e) => setNewAccName(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 border border-stone-200 dark:border-stone-750 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-white font-medium"
                                    required
                                  />
                                  <input
                                    type="email"
                                    placeholder="Email"
                                    value={newAccEmail}
                                    onChange={(e) => setNewAccEmail(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 border border-stone-200 dark:border-stone-750 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-white font-medium"
                                    required
                                  />
                                  
                                  <div className="space-y-1">
                                    <span className="block text-[8px] font-mono text-stone-400 uppercase font-bold">Photo de Profil :</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
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
                                      }}
                                      className="w-full text-[8px] text-stone-500 font-sans cursor-pointer"
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                                  >
                                    Créer & Connecter
                                  </button>
                                </form>
                              )}

                              <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
                                {simulatedAccounts.map((acc) => {
                                  const isActive = currentUserEmail.toLowerCase() === acc.email.toLowerCase();
                                  return (
                                    <button
                                      key={acc.email}
                                      type="button"
                                      onClick={() => {
                                        setCurrentUserEmail(acc.email);
                                        setCurrentUserName(acc.name);
                                        setCurrentUserAvatar(acc.avatar);
                                        try {
                                          localStorage.setItem("brocante_current_user_email", acc.email);
                                          localStorage.setItem("brocante_current_user_name", acc.name);
                                          localStorage.setItem("brocante_current_user_avatar", acc.avatar);
                                        } catch (err) {
                                          console.warn(err);
                                        }
                                      }}
                                      className={`w-full p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                                        isActive
                                          ? "bg-amber-500/5 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500"
                                          : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <img
                                          src={getAvatarPhoto(acc.avatar)}
                                          alt={acc.name}
                                          className="w-6 h-6 rounded-lg object-cover border dark:border-stone-850 shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="truncate leading-none">
                                          <span className={`block text-[11px] font-bold truncate ${isActive ? "text-amber-700 dark:text-amber-400 font-black" : "text-stone-800 dark:text-stone-200"}`}>
                                            {acc.name}
                                          </span>
                                          <span className="text-[8px] text-stone-400 font-mono block truncate mt-0.5">
                                            {acc.email}
                                          </span>
                                        </div>
                                      </div>
                                      {isActive && (
                                        <Check className="w-3.5 h-3.5 text-amber-500 stroke-[3px] shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* DEVISE D'AFFICHAGE */}
                            <div className="text-left pt-3 border-t border-stone-150 dark:border-stone-800 space-y-1.5">
                              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                <span>Devise d'affichage</span>
                              </span>
                              <div className="relative">
                                <select
                                  value={selectedCurrency.code}
                                  onChange={(e) => {
                                    const found = CURRENCIES.find(curr => curr.code === e.target.value);
                                    if (found) {
                                      setSelectedCurrency(found);
                                      try {
                                        localStorage.setItem("brocante_currency", found.code);
                                      } catch (err) {
                                        console.warn(err);
                                      }
                                    }
                                  }}
                                  className="w-full text-xs px-2.5 py-1.5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-lg font-semibold text-stone-800 dark:text-stone-200 shadow-3xs cursor-pointer appearance-none"
                                >
                                  {CURRENCIES.map((curr) => (
                                    <option key={curr.code} value={curr.code}>
                                      {curr.label} ({curr.symbol})
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>

                            {/* APPLICATION THEME */}
                            <div className="text-left pt-3 border-t border-stone-150 dark:border-stone-800 space-y-1.5">
                              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                                <span>Apparence</span>
                              </span>
                              <div className="flex gap-1.5 p-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg w-full border border-stone-200/50 dark:border-stone-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDarkMode(false);
                                    try {
                                      localStorage.setItem("brocante_theme", "light");
                                    } catch (err) {
                                      console.warn(err);
                                    }
                                  }}
                                  className={`flex-1 py-1 px-2 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    !isDarkMode
                                      ? "bg-white text-stone-900 shadow-3xs"
                                      : "text-stone-500 hover:text-stone-350"
                                  }`}
                                >
                                  <Sun className="w-3 h-3" />
                                  <span>Clair</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDarkMode(true);
                                    try {
                                      localStorage.setItem("brocante_theme", "dark");
                                    } catch (err) {
                                      console.warn(err);
                                    }
                                  }}
                                  className={`flex-1 py-1 px-2 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    isDarkMode
                                      ? "bg-stone-900 text-white shadow-3xs"
                                      : "text-stone-500 hover:text-stone-700"
                                  }`}
                                >
                                  <Moon className="w-3 h-3" />
                                  <span>Sombre</span>
                                </button>
                              </div>
                            </div>

                            {/* AJUSTABILITÉ DES FONCTIONNALITÉS */}
                            <div className="text-left pt-3 border-t border-stone-150 dark:border-stone-800 space-y-2">
                              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                                <span>Ajustabilité</span>
                              </span>
                              
                              <div className="space-y-1.5">
                                <label className="flex items-center justify-between p-2 bg-stone-100/60 dark:bg-stone-800/40 rounded-xl border border-stone-200/50 dark:border-stone-800/80 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/70 transition-colors">
                                  <div className="text-left pr-1 leading-tight">
                                    <p className="text-[10px] font-bold text-stone-900 dark:text-stone-200">Alertes mail</p>
                                    <p className="text-[8px] text-stone-450 dark:text-stone-500">Nouvelles offres/messages</p>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={prefNotifEmail} 
                                    onChange={(e) => setPrefNotifEmail(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-amber-500 rounded border-stone-300 text-amber-600 cursor-pointer"
                                  />
                                </label>

                                <label className="flex items-center justify-between p-2 bg-stone-100/60 dark:bg-stone-800/40 rounded-xl border border-stone-200/50 dark:border-stone-800/80 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/70 transition-colors">
                                  <div className="text-left pr-1 leading-tight">
                                    <p className="text-[10px] font-bold text-stone-900 dark:text-stone-200">Arrondir prix</p>
                                    <p className="text-[8px] text-stone-450 dark:text-stone-500">Montants simplifiés</p>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={prefRoundedPrices} 
                                    onChange={(e) => setPrefRoundedPrices(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-amber-500 rounded border-stone-300 text-amber-600 cursor-pointer"
                                  />
                                </label>

                                <label className="flex items-center justify-between p-2 bg-stone-100/60 dark:bg-[#1c1917]/40 rounded-xl border border-stone-200/50 dark:border-stone-800/80 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/70 transition-colors">
                                  <div className="text-left pr-1 leading-tight">
                                    <p className="text-[10px] font-bold text-stone-900 dark:text-stone-200">Géo Auto</p>
                                    <p className="text-[8px] text-stone-450 dark:text-stone-500">Brocantes proches d'abord</p>
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    checked={prefAutoGeo} 
                                    onChange={(e) => setPrefAutoGeo(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-amber-500 rounded border-stone-300 text-amber-600 cursor-pointer"
                                  />
                                </label>

                                {isProUser ? (
                                  <label className="flex items-center justify-between p-2 bg-stone-100/60 dark:bg-[#1c1917]/40 rounded-xl border border-stone-200/50 dark:border-stone-800/80 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800/70 transition-colors">
                                    <div className="text-left pr-1 leading-tight">
                                      <p className="text-[10px] font-bold text-stone-900 dark:text-stone-200">Badge VIP</p>
                                      <p className="text-[8px] text-stone-450 dark:text-stone-500">Étoile dorée d'accréditation</p>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      checked={prefVipBadge} 
                                      onChange={(e) => setPrefVipBadge(e.target.checked)}
                                      className="w-3.5 h-3.5 accent-amber-500 rounded border-stone-300 text-amber-600 cursor-pointer"
                                    />
                                  </label>
                                ) : (
                                  <div 
                                    onClick={() => setIsPremiumModalOpen(true)}
                                    className="flex items-center justify-between p-2 bg-stone-100/30 dark:bg-stone-800/20 rounded-xl border border-dashed border-stone-250 dark:border-stone-800/60 opacity-80 hover:opacity-100 cursor-pointer hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all text-left"
                                  >
                                    <div className="pr-1 leading-tight">
                                      <div className="flex items-center gap-1">
                                        <p className="text-[10px] font-bold text-stone-450 dark:text-stone-450">Badge VIP</p>
                                        <span className="text-[7px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-extrabold px-1 rounded-xs">PRO</span>
                                      </div>
                                      <p className="text-[8px] text-stone-400 dark:text-stone-500">Réservé aux pros</p>
                                    </div>
                                    <Crown className="w-3 h-3 text-amber-500 fill-current shrink-0 animate-pulse" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsSidebarOpen(false);
                                setIsAccountModalOpen(true);
                              }}
                              className="w-full bg-white dark:bg-stone-900 hover:bg-stone-5 hover:text-stone-950 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-750 text-[10px] text-stone-750 dark:text-stone-200 font-bold py-2 rounded-lg text-center transition-colors shadow-2xs cursor-pointer"
                            >
                              Plus de paramètres (Commandes...)
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-150/45">
                    <h4 className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-3">Navigation principale</h4>
                    <nav className="space-y-2">
                      <button
                        onClick={() => {
                          setViewMode("marketplace");
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          viewMode === "marketplace"
                            ? "bg-[#ffffff] text-[#3a2e2e] border-[#1b1816] shadow-xs"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-150 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ShoppingBag className="w-4 h-4 text-amber-500" />
                          <span>Acheter (Annonces)</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-900 px-1 py-0.5 rounded">Marché</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsSidebarOpen(false);
                          handleOpenCreateListing();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer bg-stone-50 hover:bg-stone-100 border-stone-150 text-stone-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <Plus className="w-4 h-4 text-amber-500 stroke-[2px]" />
                          <span>Vendre un article</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-amber-600 text-white px-1 py-0.5 rounded font-bold">Vendre</span>
                      </button>

                      <button
                        onClick={() => {
                          setViewMode("demands");
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          viewMode === "demands"
                            ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-150 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Megaphone className="w-4 h-4 text-amber-500" />
                          <span>Avis de Recherche</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-900 px-1 py-0.5 rounded">Recherches</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsSidebarOpen(false);
                          if (!currentUserEmail) {
                            setIsLoginOpen(true);
                          } else {
                            setViewMode("messages");
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          viewMode === "messages"
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-150 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MessageCircle className="w-4 h-4 text-amber-500" />
                          <span>Messagerie</span>
                        </div>
                        {totalUnreadSim > 0 ? (
                          <span className="bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                            {totalUnreadSim}
                          </span>
                        ) : (
                          <span className="text-[9px] text-stone-400 font-mono">Tchat</span>
                        )}
                      </button>

                      {/* Notifications entry in the sidebar */}
                      <button
                        onClick={() => {
                          setIsSidebarOpen(false);
                          if (!currentUserEmail) {
                            setIsLoginOpen(true);
                          } else {
                            setViewMode("notifications");
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          viewMode === "notifications"
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-150 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <span>Notifications</span>
                        </div>
                        {notifications.filter(n => !n.read).length > 0 ? (
                          <span className="bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full z-10 scale-105 shadow-3xs">
                            {notifications.filter(n => !n.read).length}
                          </span>
                        ) : (
                          <span className="text-[9px] text-stone-400 font-mono">Infos</span>
                        )}
                      </button>

                      {/* Dashboard route link */}
                      {currentUserEmail && (
                        <button
                          onClick={() => {
                            setViewMode("dashboard");
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            viewMode === "dashboard"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-stone-50 hover:bg-stone-100 border-stone-150 text-stone-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                            <span>Mon Dashboard</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase bg-stone-200 text-stone-800 px-1 py-0.5 rounded">Ventes</span>
                        </button>
                      )}

                      {/* Admin route link (Visible only to the administrator) */}
                      {currentUserEmail && currentUserEmail.toLowerCase().trim() === "fd6016826@gmail.com" && (
                        <button
                          onClick={() => {
                            setViewMode("admin");
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            viewMode === "admin"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            <span>Console Admin</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase bg-amber-500 text-white px-1 py-0.5 rounded animate-pulse">Admin</span>
                        </button>
                      )}

                    </nav>
                  </div>

                  {/* General setting button inside sidebar */}
                  <div className="pt-2.5 border-t border-stone-150/45">
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full flex items-center justify-between text-left text-xs bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border border-stone-200 py-2 px-3 rounded-xl transition cursor-pointer text-stone-700"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span>⚙️</span>
                        <span>Paramètres de l'application</span>
                      </span>
                      <span className="text-[9px] font-mono uppercase bg-stone-200 text-stone-850 px-1 py-0.5 rounded leading-none">
                        Ouvrir
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-150 flex-shrink-0 text-center">
                  <div className="text-center text-[9px] text-stone-400 font-mono">
                    La Brocante • Marché Citoyen
                  </div>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
        
        {/* Listing Detail Popup Modal */}
        {activeListing && (
          <ListingDetailsModal
            key="details-modal"
            listing={activeListing}
            currentUserEmail={currentUserEmail}
            currentUserName={currentUserName}
            onClose={() => setActiveListing(null)}
            onToggleSold={handleToggleSold}
            onDelete={handleDeleteListing}
            onSendMessage={handleStartChatFromDetails}
            onOpenLogin={() => setIsLoginOpen(true)}
            currency={selectedCurrency}
            isDarkMode={isDarkMode}
            onConfirmPurchase={handleConfirmPurchase}
            onConfirmSale={handleConfirmSale}
            onContactSeller={handleContactSeller}
          />
        )}

        {/* Sell an Item Creator Form Modal */}
        {isCreateModalOpen && (
          <CreateListingModal
            key="create-modal"
            currentUserEmail={currentUserEmail}
            currentUserName={currentUserName}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateListingSubmit}
            isProUser={isProUser}
            onOpenUpgradeModal={() => setIsPremiumModalOpen(true)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Post a Buyer Demand Form Modal */}
        {isDemandModalOpen && (
          <CreateDemandModal
            key="demand-modal"
            currentUserEmail={currentUserEmail}
            currentUserName={currentUserName}
            onClose={() => setIsDemandModalOpen(false)}
            onSubmit={handleCreateDemandSubmit}
            selectedCurrency={selectedCurrency}
          />
        )}

        {/* Help Info Modal for Recherches Citoyennes */}
        {showDemandInfoModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-200 shrink-0" />
                  <h3 className="font-serif font-black uppercase tracking-wide text-xs sm:text-sm text-amber-50">
                    Recherches Citoyennes d'Achat
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemandInfoModal(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5.5 space-y-4 text-stone-700 text-xs leading-relaxed">
                <p className="text-stone-900 font-bold leading-snug">
                  Un système novateur de mise en relation inversée pour dynamiser l'économie circulaire locale et solidaire.
                </p>

                <div className="space-y-3.5 pt-1">
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                      1
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-[11.5px] leading-tight mb-0.5">Exprimez votre besoin d'achat</h4>
                      <p className="text-[10.5px] text-stone-500 font-medium">
                        Remplissez un formulaire de recherche avec votre budget idéal, la taille, l'état attendu, et une photo d'inspiration.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                      2
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-[11.5px] leading-tight mb-0.5">Les vendeurs consultent vos annonces</h4>
                      <p className="text-[10.5px] text-stone-500 font-medium font-medium">
                        Tous les vendeurs de la brocante voient vos avis de recherche. Si l'un d'eux possède le produit adéquat, il peut vous le proposer directement.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                      3
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-[11.5px] leading-tight mb-0.5">Discutez en direct de l'offre</h4>
                      <p className="text-[10.5px] text-stone-500 font-medium">
                        Un canal tchat privé s'ouvre pour vous permettre d'échanger et de finaliser l'achat de manière conviviale et de main à main.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-150 text-[10.5px] text-stone-500 italic mt-4">
                  💡 <strong>Astuce</strong> : N'hésitez pas à publier vos souhaits les plus précis ! Vos voisins ont peut-être de vrais trésors cachés dans leurs armoires.
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-stone-50 border-t border-stone-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDemandInfoModal(false)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-3xs"
                >
                  J'ai compris !
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Global Account Management & Devises & Simulation Profiles Modal */}
        {isAccountModalOpen && (
          <AccountManagementModal
            key="account-modal"
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            currentUserEmail={currentUserEmail}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            setCurrentUserEmail={(email) => {
              if (!email) {
                handleLogout();
              } else {
                setCurrentUserEmail(email);
              }
            }}
            setCurrentUserName={setCurrentUserName}
            setCurrentUserAvatar={setCurrentUserAvatar}
            simulatedAccounts={simulatedAccounts}
            setSimulatedAccounts={setSimulatedAccounts}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            listings={listings}
            threads={threads}
            favorites={favorites}
            setFavorites={setFavorites}
            onRefreshListings={fetchListings}
            isProUser={isProUser}
            onOpenUpgradeModal={() => setIsPremiumModalOpen(true)}
            prefRoundedPrices={prefRoundedPrices}
            prefNotifEmail={prefNotifEmail}
            prefNotifAnnouncements={prefNotifAnnouncements}
            prefAutoGeo={prefAutoGeo}
            prefVipBadge={prefVipBadge}
            setPrefRoundedPrices={setPrefRoundedPrices}
            setPrefNotifEmail={setPrefNotifEmail}
            setPrefNotifAnnouncements={setPrefNotifAnnouncements}
            setPrefAutoGeo={setPrefAutoGeo}
            setPrefVipBadge={setPrefVipBadge}
            onOpenLogin={() => {
              setIsAccountModalOpen(false);
              setIsLoginOpen(true);
            }}
          />
        )}

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          key="premium-modal"
          isOpen={isPremiumModalOpen}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName || "Chineur"}
          onClose={() => setIsPremiumModalOpen(false)}
          onUpgradeSuccess={() => {
            setIsProUser(true);
            fetchListings();
          }}
        />

        {/* User Profile Details Modal */}
        {selectedUserProfile && (
          <UserProfileModal
            key="user-profile-modal"
            name={selectedUserProfile.name}
            email={selectedUserProfile.email}
            onClose={() => setSelectedUserProfile(null)}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      {/* Centered Desktop & Mobile Bottom Floating Navigation Utilizing ExpandableTabs */}
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-52 w-auto px-4 max-w-[95vw] transition-all duration-300 ease-in-out ${
        isNavVisible && !shouldHideNav ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      }`}>
        <ExpandableTabs
          tabs={[
            { 
              title: "Accueil", 
              icon: Home,
              className: "border border-solid",
              style: { borderColor: "#ea9b66", color: "#d2783c" }
            },
            { 
              title: "Marché", 
              icon: ShoppingBag,
              className: "border border-solid",
              style: { color: "#d2783c", borderColor: "#b35627", backgroundColor: "#251e1e" },
              iconStyle: { color: "#d2783c" },
              spanStyle: { color: "#c2581f" }
            },
            { 
              title: "Notifications" + (notifications.filter(n => !n.read).length > 0 ? ` (${notifications.filter(n => !n.read).length})` : ""), 
              icon: Bell,
              className: "border border-solid",
              style: { borderColor: "#d2783c" },
              iconStyle: { color: "#d2783c" }
            },
            { 
              title: "Avis de Recherche" + (demands.length > 0 ? ` (${demands.length})` : ""), 
              icon: Megaphone,
              className: "border border-solid",
              style: { borderColor: "#d2783c" },
              iconStyle: { color: "#d2783c" }
            },
            { type: "separator" as const },
            { 
              title: "Mon Espace", 
              icon: SlidersHorizontal,
              className: "border border-solid",
              style: { borderColor: "#d2783c" },
              iconStyle: { color: "#d2783c" }
            },
            { 
              title: "Messagerie" + (totalUnreadSim > 0 ? ` (${totalUnreadSim})` : ""), 
              icon: MessageCircle,
              style: { color: "#d2783c" }
            },
          ]}
          selected={getViewIndex()}
          onChange={handleTabChange}
          activeColor="text-amber-500"
          className="border-stone-200/80 bg-white/95 dark:border-stone-850 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl shrink-0 flex items-center justify-center"
          style={{ color: "#d2783c" }}
        />
      </div>
      
    </div>
  );
}
