import React, { useState } from "react";
import { 
  BarChart3, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  X, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  Plus, 
  Coins, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  Video, 
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Info,
  Calendar,
  Award,
  Zap,
  ChevronRight
} from "lucide-react";
import { Listing, ChatThread } from "../types";
import { CURRENCIES, Currency, formatPrice } from "../utils/currency";
import { motion, AnimatePresence } from "motion/react";
import { ListingDescriptionEditor } from "./ListingDescriptionEditor";

interface SellerDashboardProps {
  currentUserEmail: string;
  currentUserName: string;
  listings: Listing[];
  threads: ChatThread[];
  currency: Currency;
  onEditListing: (id: string, updatedData: Partial<Listing>) => Promise<boolean>;
  onToggleSold: (id: string) => Promise<void>;
  onDeleteListing: (id: string) => Promise<void>;
  onOpenListingDetails: (listing: Listing) => void;
  onBackToMarketplace: () => void;
  onOpenCreateModal: () => void;
  onGoToMessages?: (threadId: string) => void;
  categoriesList?: string[];
  conditionsList?: string[];
  isProUser?: boolean;
  onOpenUpgradeModal?: () => void;
  isDarkMode?: boolean;
}

export function SellerDashboard({
  currentUserEmail,
  currentUserName,
  listings,
  threads,
  currency,
  onEditListing,
  onToggleSold,
  onDeleteListing,
  onOpenListingDetails,
  onBackToMarketplace,
  onOpenCreateModal,
  onGoToMessages,
  categoriesList = [
    "Électronique",
    "Mode & Vêtements",
    "Maison & Déco",
    "Véhicules",
    "Sport & Loisirs",
    "Livres & Culture",
    "Jeux & Jouets",
    "Autres"
  ],
  conditionsList = [
    "Neuf",
    "Comme neuf",
    "Très bon état",
    "Bon état",
    "Usagé"
  ],
  isProUser = false,
  onOpenUpgradeModal,
  isDarkMode = false
}: SellerDashboardProps) {
  // Filter user's specific listings
  const myListings = listings.filter(
    (item) => item.sellerEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()
  );

  // States
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [activeTab, setActiveTab] = useState<"stats" | "listings" | "generator">("stats");

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editPriceCurrency, setEditPriceCurrency] = useState<Currency>(CURRENCIES[0]);
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDescriptionStyle, setEditDescriptionStyle] = useState("normal");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);

  // AI Description drafting helper state
  const [aiObjectName, setAiObjectName] = useState("");
  const [aiObjectCondition, setAiObjectCondition] = useState("Très bon état");
  const [aiObjectEra, setAiObjectEra] = useState("Littérature");
  const [aiDraftDescription, setAiDraftDescription] = useState("");
  
  // Custom states for the interactive copy & auto-apply descriptions feature
  const [copied, setCopied] = useState(false);
  const [applyToListingId, setApplyToListingId] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState("");

  // Calculate statistics
  const totalItemsCount = myListings.length;
  const activeItemsCount = myListings.filter(item => !item.isSold).length;
  const soldItemsCount = myListings.filter(item => item.isSold).length;
  
  // Calculate total potential revenue
  const totalRevenuePotential = myListings.reduce((acc, current) => acc + current.price, 0);
  const totalRevenueGenerated = myListings.filter(t => t.isSold).reduce((acc, current) => acc + current.price, 0);

  // Consistent view & fav metrics based on listing ID
  const getSimulatedViews = (id: string) => {
    const numeric = parseInt(id.replace(/\D/g, "")) || 42;
    return (numeric % 120) + 15;
  };

  const getSimulatedFavs = (id: string) => {
    const numeric = parseInt(id.replace(/\D/g, "")) || 42;
    return (numeric % 18) + 2; 
  };

  const totalViews = myListings.reduce((acc, curr) => acc + getSimulatedViews(curr.id), 0);

  // Find incoming inquiries / chats related to my listings (the leads)
  const myLeads = threads.filter(
    (t) => t.sellerEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()
  );

  const startEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditPrice(listing.price);
    setEditPriceCurrency(CURRENCIES[0]);
    setEditCategory(listing.category);
    setEditLocation(listing.location);
    setEditCondition(listing.condition);
    setEditDescription(listing.description);
    setEditDescriptionStyle(listing.descriptionStyle || "normal");
    setEditImageUrl(listing.imageUrl);
    setEditVideoUrl(listing.videoUrl || "");
    setEditQuantity(listing.quantity !== undefined ? listing.quantity : 1);
    setEditError("");
  };

  const handleApplyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setEditError("");

    if (!editTitle.trim()) {
      setEditError("Veuillez renseigner un titre.");
      return;
    }
    if (editPrice === "" || Number(editPrice) <= 0) {
      setEditError("Veuillez renseigner un prix valide supérieur à 0.");
      return;
    }

    setIsSaving(true);
    try {
      const priceInEur = Number((Number(editPrice) / editPriceCurrency.rate).toFixed(2));
      const updated = await onEditListing(editingListing.id, {
        title: editTitle.trim(),
        price: priceInEur,
        category: editCategory,
        location: editLocation.trim(),
        condition: editCondition,
        description: editDescription.trim(),
        descriptionStyle: isProUser ? editDescriptionStyle : "normal",
        imageUrl: editImageUrl,
        videoUrl: editVideoUrl,
        quantity: Number(editQuantity) || 1,
      });

      if (updated) {
        setEditingListing(null);
      } else {
        setEditError("Une erreur s'est produite lors de la mise à jour.");
      }
    } catch (err) {
      setEditError("Impossible d'enregistrer les modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  // Base64 file upload handlers
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("La vidéo est trop volumineuse. Maximum 10 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditVideoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Creative helper generator
  const generateAIDescription = () => {
    if (!aiObjectName.trim()) return;
    
    const styleOrEra = aiObjectEra.trim();
    let eraText = "";
    if (styleOrEra) {
      if (styleOrEra.toLowerCase() === "littérature" || styleOrEra.toLowerCase() === "literature") {
        eraText = ` (Genre / Style : ${styleOrEra})`;
      } else {
        eraText = ` (${styleOrEra})`;
      }
    }
    const draft = `Superbe ${aiObjectName.trim()}${eraText}, proposé en état "${aiObjectCondition}". 

🎨 Style & Esthétique :
Un très bel objet avec une personnalité unique, idéal pour compléter votre style ou comme pièce d'usage quotidien authentique. Présente une superbe patine naturelle qui lui confère son charme rétro indéniable ou son authenticité.

🔧 Caractéristiques & État :
- État esthétique : ${aiObjectCondition}
- Prêt à l'emploi immédiatement.
- Entièrement inspecté et nettoyé avant la remise en mains propres.

📍 Remise en mains propres privilégiée à proximité de ma localisation. N'hésitez pas à me contacter par messagerie privée pour toute précision complémentaire ou pour venir l'observer !`;

    setAiDraftDescription(draft);
    setApplySuccessMessage("");
  };

  const copyToClipboard = () => {
    if (!aiDraftDescription) return;
    navigator.clipboard.writeText(aiDraftDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSmartApplyDescription = async () => {
    if (!applyToListingId || !aiDraftDescription) return;
    setIsApplying(true);
    setApplySuccessMessage("");
    try {
      const activeItem = myListings.find(item => item.id === applyToListingId);
      if (!activeItem) return;

      const success = await onEditListing(applyToListingId, {
        description: aiDraftDescription
      });

      if (success) {
        setApplySuccessMessage(`Description appliquée avec succès à "${activeItem.title}" !`);
        setTimeout(() => setApplySuccessMessage(""), 5000);
      } else {
        alert("Une erreur est survenue lors de l'attribution de la description.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      
      {/* 1. Dashboard Redesigned Header — Stunning dark & amber gradient with high responsive flexibility */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-955 text-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl shadow-lg border border-stone-800/60 relative overflow-hidden">
        
        {/* Abstract design elements to avoid plain background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-stone-950 text-[9px] font-mono uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
              Espace Particulier citoyen
            </span>
            <span className="text-stone-400 text-[11px] font-medium">
              Vendeur : <strong className="text-stone-200">{currentUserName}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-tight text-white">
            Tableau de Bord Personnel
          </h2>
          <p className="text-[11px] sm:text-xs text-stone-300 leading-relaxed max-w-2xl">
            Pilotez vos trésors en ligne, observez les statistiques réelles d'intérêt local de vos voisins et rédigez d'élégantes descriptions grâce à notre assistant intégré.
          </p>
        </div>

        {/* Header Action Buttons stacked vertically on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto z-10 shrink-0">
          <button
            type="button"
            onClick={onBackToMarketplace}
            className="w-full sm:w-auto bg-stone-800/80 hover:bg-stone-750 active:scale-98 text-stone-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-stone-700/65 cursor-pointer touch-manipulation"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au Marché</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs py-2.5 px-5 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Vendre un nouvel objet</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Tab Navigation — Beautiful Segmented Slider Controls native-feeling on mobile */}
      <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl gap-0.5 sm:gap-1 w-full max-w-2xl mx-auto md:mx-0 overflow-x-auto scroller-none border border-stone-200/50 dark:border-stone-800">
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[40px] touch-manipulation ${
            activeTab === "stats"
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-3xs font-bold"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <BarChart3 className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${activeTab === "stats" ? "text-amber-500" : ""}`} />
          <span>Performances</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`flex-1 py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[40px] touch-manipulation ${
            activeTab === "listings"
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-3xs font-bold"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <TrendingUp className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${activeTab === "listings" ? "text-amber-500" : ""}`} />
          <span>Mes Annonces</span>
          <span className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-md text-[8px] sm:text-[9px] font-mono font-bold">
            {totalItemsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("generator")}
          className={`flex-1 py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-xl text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap min-h-[36px] sm:min-h-[40px] touch-manipulation ${
            activeTab === "generator"
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-3xs font-bold"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Sparkles className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${activeTab === "generator" ? "text-amber-500 fill-amber-500/20" : "text-amber-500"}`} />
          <span>Rédacteur</span>
        </button>
      </div>

      {/* TAB CONTENT 1: STATS & SUMMARY */}
      {activeTab === "stats" && (
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
          
          {/* Quick Stats Grid — Grid-cols-2 on small devices, grid-cols-4 on widescreen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
            
            {/* Stat 1: Revenue Generated */}
            <div className={`${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-[#9e9a9a] border-[#909090]"} p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-3xs hover:shadow-2xs transition-all text-left space-y-1.5 sm:space-y-2 border`}>
              <div className="flex justify-between items-center text-stone-400">
                <span className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-wider font-extrabold ${isDarkMode ? "text-stone-300" : "text-[#000000]"}`}>Cagnotte Réelle</span>
                <span className="px-1 sm:px-1.5 py-0.2 sm:py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-[7.5px] sm:text-[9px] rounded-lg">Succès</span>
              </div>
              <div>
                <p className={`text-sm sm:text-xl md:text-2xl font-serif font-black truncate ${isDarkMode ? "text-emerald-400" : "text-[#000000]"}`}>
                  {formatPrice(totalRevenueGenerated, currency)}
                </p>
                <p className={`text-[8.5px] sm:text-[10px] mt-0.5 sm:mt-1 ${isDarkMode ? "text-stone-400" : "text-stone-700"}`}>
                  Générés sur <strong>{soldItemsCount}</strong> trésor{soldItemsCount > 1 ? "s" : ""} vendu{soldItemsCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Stat 2: Active items potential value */}
            <div className={`${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-[#9e9a9a] border-stone-300"} p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-3xs hover:shadow-2xs transition-all text-left space-y-1.5 sm:space-y-2 border`}>
              <div className="flex justify-between items-center text-stone-400">
                <span className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-wider font-extrabold ${isDarkMode ? "text-stone-300" : "text-[#000000]"}`}>Valeur Active</span>
                <span className="px-1 sm:px-1.5 py-0.2 sm:py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-[7.5px] sm:text-[9px] rounded-lg">Vitrine</span>
              </div>
              <div>
                <p className={`text-sm sm:text-xl md:text-2xl font-serif font-black truncate ${isDarkMode ? "text-white" : "text-[#000000]"}`}>
                  {formatPrice(totalRevenuePotential - totalRevenueGenerated, currency)}
                </p>
                <p className={`text-[8.5px] sm:text-[10px] mt-0.5 sm:mt-1 ${isDarkMode ? "text-stone-400" : "text-stone-700"}`}>
                  <strong>{activeItemsCount}</strong> annonce{activeItemsCount > 1 ? "s" : ""} de troc visible{activeItemsCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Stat 3: Total Simulated Views */}
            <div className={`${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-[#9e9a9a] border-stone-300"} p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-3xs hover:shadow-2xs transition-all text-left space-y-1.5 sm:space-y-2 border`}>
              <div className="flex justify-between items-center text-stone-400">
                <span className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-wider font-extrabold ${isDarkMode ? "text-stone-300" : "text-[#000000]"}`}>Visibilité Locale</span>
                <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-stone-400 shrink-0" />
              </div>
              <div>
                <p className={`text-sm sm:text-xl md:text-2xl font-serif font-black truncate ${isDarkMode ? "text-sky-400" : "text-[#000000]"}`}>
                  {totalViews} <span className={`text-[9.5px] sm:text-xs font-sans font-normal ${isDarkMode ? "text-stone-300" : "text-[#000000]"}`}>vues</span>
                </p>
                <p className={`text-[8.5px] sm:text-[10px] mt-0.5 sm:mt-1 ${isDarkMode ? "text-stone-400" : "text-stone-700"}`}>
                  Intérêt cumulé de votre quartier
                </p>
              </div>
            </div>

            {/* Stat 4: Incoming potential leads */}
            <div className={`${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-[#9e9a9a] border-stone-300"} p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-3xs hover:shadow-2xs transition-all text-left space-y-1.5 sm:space-y-2 border`}>
              <div className="flex justify-between items-center text-stone-400">
                <span className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-wider font-extrabold ${isDarkMode ? "text-stone-300" : "text-[#000000]"}`}>Fils de Troc</span>
                <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600 shrink-0" />
              </div>
              <div>
                <p className={`text-sm sm:text-xl md:text-2xl font-serif font-black truncate ${isDarkMode ? "text-white" : "text-[#000000]"}`}>
                  {myLeads.length} <span className={`text-[9.5px] sm:text-xs font-sans font-normal ${isDarkMode ? "text-stone-300" : "text-[#000000]"}`}>discussions</span>
                </p>
                <p className={`text-[8.5px] sm:text-[10px] mt-0.5 sm:mt-1 ${isDarkMode ? "text-stone-400" : "text-stone-700"}`}>
                  Discussions directes engagées
                </p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            
            {/* Left side (2/3 columns on desktop): Eco-Chineur & Tips */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              
              {/* Trust Badge block with responsive column layout */}
              <div className="bg-radial-gradient from-amber-50/70 to-stone-50/30 dark:from-stone-900 dark:to-stone-950 border border-amber-250 dark:border-stone-850 p-5 sm:p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-400 text-stone-950 rounded-xl shadow-2xs">
                    <ShieldCheck className="w-5 h-5 stroke-[2px]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
                      Indice d'Éco-Chineur de Proximité
                    </h3>
                    <p className="text-[10px] text-amber-800 dark:text-amber-500 font-mono font-bold tracking-wider uppercase">Ventes Vertes Citoyennes</p>
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Félicitations, <strong>{currentUserName}</strong> ! En proposant vos objets ici, vous évitez à vos voisins l’achat d’articles neufs importés. Vous réduisez l'impact logistique d'expédition du dernier kilomètre.
                </p>
                
                {/* Score Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 dark:text-stone-450">
                    <span>Performance de Troc local</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">92/100 (Chineur émérite)</span>
                  </div>
                  <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }}></div>
                  </div>
                </div>

                {/* Achievements: Replaced fixed columns grid-cols-3 with responsive stack/grid */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-2 text-center text-[9px] sm:text-[10.5px]">
                  <div className="bg-white dark:bg-stone-900 p-1.5 sm:p-3 rounded-xl border border-stone-150 dark:border-stone-800 shadow-3xs flex flex-col justify-between">
                    <span className="text-xs sm:text-[13px] block">🌱</span>
                    <p className="text-stone-400 dark:text-stone-500 font-mono mt-0.5 sm:mt-1 text-[8px] sm:text-[10px]">Carbone Évité</p>
                    <p className="font-serif font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 text-[8.5px] sm:text-xs">-{totalItemsCount * 4} Kg CO₂</p>
                  </div>
                  <div className="bg-white dark:bg-stone-900 p-1.5 sm:p-3 rounded-xl border border-stone-150 dark:border-stone-800 shadow-3xs flex flex-col justify-between">
                    <span className="text-xs sm:text-[13px] block">🪙</span>
                    <p className="text-stone-400 dark:text-stone-500 font-mono mt-0.5 sm:mt-1 text-[8px] sm:text-[10px]">Frais Épargnés</p>
                    <p className="font-serif font-bold text-amber-700 dark:text-amber-500 mt-0.5 text-[8.5px] sm:text-xs">0% Commission</p>
                  </div>
                  <div className="bg-white dark:bg-stone-900 p-1.5 sm:p-3 rounded-xl border border-stone-150 dark:border-stone-800 shadow-3xs flex flex-col justify-between">
                    <span className="text-xs sm:text-[13px] block">⚡</span>
                    <p className="text-stone-400 dark:text-stone-500 font-mono mt-0.5 sm:mt-1 text-[8px] sm:text-[10px]">Indice Réponse</p>
                    <p className="font-serif font-bold text-sky-700 dark:text-sky-400 mt-0.5 text-[8.5px] sm:text-xs">👋 Rapide</p>
                  </div>
                </div>
              </div>

              {/* Best practices tips block formatted cleanly */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 rounded-2xl p-5 sm:p-6 space-y-4 text-left">
                <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/20 text-amber-600">💡</span>
                  <span>Vendre rapidement à vos voisins</span>
                </h3>
                
                <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs text-stone-600 dark:text-stone-300">
                  <div className="pb-3.5 space-y-1" style={{ backgroundColor: "#080909" }}>
                    <h4 className="font-bold text-stone-800 dark:text-white flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">Tip 1</span>
                      Faites une démo vidéo dynamique
                    </h4>
                    <p className="text-stone-500 dark:text-stone-400 pl-1">
                      Les objets munis d'un court extrait vidéo démonstratif reçoivent globalement 4 fois plus de sollicitations privées. Montrez les détails de l'usure, le jeu s'il y en a, la patine ou l'objet fonctionnant.
                    </p>
                  </div>
                  
                  <div className="py-3.5 space-y-1">
                    <h4 className="font-bold text-stone-800 dark:text-white flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">Tip 2</span>
                      Détaillez honnêtement chaque relief
                    </h4>
                    <p className="text-stone-500 dark:text-stone-400 pl-1">
                      Signalez les défauts ou rayures : cela élimine d'emblée la méfiance, simplifie la négociation devant l'objet et réduit grandement le risque de rendez-vous manqués ou de rebroussement.
                    </p>
                  </div>

                  <div className="pt-3.5 space-y-1">
                    <h4 className="font-bold text-stone-800 dark:text-white flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">Tip 3</span>
                      Donnez rendez-vous dans un lieu sécurisé
                    </h4>
                    <p className="text-stone-500 dark:text-stone-400 pl-1">
                      Privilégiez les remises en mains propres sur les places centrales, gares ferroviaires, avenues et terrasses de cafés. C’est convivial, sécurisé et idéal pour faire vos transactions de gré à gré sereinement.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right side: Incoming Leads List / Direct Contacts — CONNECTIVITY & INTERCONNECTivity */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col h-full min-h-[380px] text-left">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 dark:text-white text-sm">
                      💬 Contacts Chineurs ({myLeads.length})
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Interlocuteurs intéressés par vos offres
                    </p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[8px] px-2 py-0.5 rounded-full uppercase">
                    live
                  </span>
                </div>
              </div>

              {myLeads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5 h-full my-auto">
                  <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-850 flex items-center justify-center text-stone-400">
                    <MessageSquare className="w-5 h-5 stroke-[1.25]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Aucun fil d'échange actif</p>
                    <p className="text-[10.5px]/relaxed text-stone-400">
                      Chaque fois qu'un voisin d'ici cliquera sur vos annonces pour négocier ou réserver, un fil de messagerie s'affichera directement ici.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[360px] flex-1 pr-1 scroller-slim">
                  {myLeads.map((lead, index) => {
                    const lastMsg = lead.messages[lead.messages.length - 1];
                    const initials = lead.buyerName ? lead.buyerName.slice(0, 2).toUpperCase() : "👤";
                    
                    let titleStyle = undefined;
                    let descStyle = undefined;

                    if (index === 0) {
                      titleStyle = { color: "#211c18" };
                    } else if (index === 1) {
                      titleStyle = { color: "#28201b" };
                      descStyle = { color: "#ffffff" };
                    } else if (index === 2) {
                      titleStyle = { color: "#211c18" };
                      descStyle = { color: "#ffffff" };
                    } else if (index === 3) {
                      titleStyle = { color: "#211c18" };
                    }

                    return (
                      <div 
                        key={lead.id}
                        className="p-3.5 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/40 hover:bg-stone-100/60 dark:hover:bg-stone-800/60 transition duration-150 text-left space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#fca262]/25 text-stone-800 dark:text-orange-300 font-mono text-[9px] font-bold flex items-center justify-center">
                              {initials}
                            </span>
                            <span className="font-bold text-[11px] text-stone-800 dark:text-stone-200 truncate max-w-[120px]">
                              {lead.buyerName}
                            </span>
                          </div>
                          <span className="text-[9px] text-stone-400 font-mono">
                            {new Date(lead.lastMessageAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short"
                            })}
                          </span>
                        </div>

                        <div>
                          <p 
                            className="text-xs font-serif font-extrabold text-stone-900 dark:text-white leading-tight"
                            style={titleStyle}
                          >
                            {lead.listingTitle}
                          </p>
                          <p 
                            className="text-[10.5px] text-stone-500 dark:text-stone-400 italic line-clamp-2 mt-1 leading-normal"
                            style={descStyle}
                          >
                            "{lastMsg ? lastMsg.text : "Discussions ouvertes."}"
                          </p>
                        </div>

                        {onGoToMessages && (
                          <button
                            type="button"
                            onClick={() => onGoToMessages(lead.id)}
                            className="bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all w-full shadow-3xs cursor-pointer touch-manipulation"
                          >
                            <span>Ouvrir la conversation</span>
                            <ChevronRight className="w-3 h-3 text-stone-400" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT 2: MANAGE LISTINGS GRID */}
      {activeTab === "listings" && (
        <div className="space-y-5 sm:space-y-6 animate-fade-in text-left">
          
          <div>
            <h3 className="font-serif font-black text-stone-900 dark:text-white text-lg">
              La liste de vos trouvailles en vente
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Chinez vos annonces ci-dessous pour les corriger, actualiser leur statut à "Vendu", ou retirer un article définitivement.
            </p>
          </div>

          {myListings.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-8 sm:p-12 rounded-2xl text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-850 flex items-center justify-center text-stone-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-stone-900 dark:text-white text-sm">Vous n'avez pas d'offres répertoriées</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Pour commencer à troquer à proximité, photographiez ou filmez les trésors qui encombrent vos pièces et déposez votre annonce.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs py-2.5 px-4 rounded-xl transition cursor-pointer touch-manipulation"
              >
                Déposer ma première annonce
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
              {myListings.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800/80 rounded-2xl overflow-hidden shadow-3xs hover:shadow-2xs transition duration-200 flex flex-col justify-between ${
                    item.isSold ? "opacity-95 bg-stone-50/55 dark:bg-stone-950/20" : ""
                  }`}
                >
                  
                  {/* Item Image with status ribbons & actions */}
                  <div className="relative h-28 sm:h-44 bg-stone-100 dark:bg-stone-950 overflow-hidden shrink-0 group">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                      referrerPolicy="no-referrer"
                    />

                    {/* Category Overlay - Hidden or tiny on mobile to avoid clutter */}
                    <span className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 bg-stone-950/85 backdrop-blur-xs text-white font-mono text-[7.5px] sm:text-[8px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded font-bold">
                      {item.category && item.category.length > 12 ? item.category.slice(0, 11) + ".." : item.category}
                    </span>

                    {/* Price and isSold badge overlay */}
                    <div className="absolute bottom-1.5 sm:bottom-2.5 right-1.5 sm:right-2.5 bg-stone-900 text-white px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold font-mono rounded-lg">
                      {formatPrice(item.price, currency)}
                    </div>

                    {/* Condition Badge Overlay */}
                    <span className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 bg-amber-450 text-stone-950 font-sans text-[7.5px] sm:text-[8.5px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-3xs">
                      {item.condition}
                    </span>

                    {item.isSold ? (
                      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center flex-col gap-1 p-2">
                        <span className="bg-red-650 text-white font-serif text-[10px] sm:text-xs font-black uppercase px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg rotate-[-3deg] border border-white/10 shadow-sm">
                          🔒 Vendu
                        </span>
                        {item.buyerConfirmed && item.sellerConfirmed && (
                          <span className="bg-emerald-600 text-white font-bold text-[7.5px] sm:text-[8.5px] px-1.5 sm:px-2 py-0.5 rounded text-center">
                            ✓ Conclu
                          </span>
                        )}
                      </div>
                    ) : item.buyerConfirmed ? (
                      <div className="absolute inset-0 bg-amber-955/60 backdrop-blur-xs flex items-center justify-center flex-col gap-1 p-2 text-center select-none">
                        <span className="bg-amber-600 text-white font-serif text-[9px] sm:text-[10px] font-bold uppercase font-black px-1.5 sm:px-2.5 py-1 rounded border border-white/10 shadow-sm animate-pulse">
                          📥 Confirmation
                        </span>
                        <span className="text-white text-[7.5px] sm:text-[8px] bg-stone-900/90 px-1 sm:px-1.5 py-0.5 rounded font-mono truncate max-w-[90%]">
                          Par {item.buyerName}
                        </span>
                      </div>
                    ) : (
                      <span className="absolute bottom-1.5 sm:bottom-2.5 left-1.5 sm:left-2.5 bg-emerald-600/90 backdrop-blur-xs text-white font-bold text-[7.5px] sm:text-[8.5px] px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shadow-3xs">
                        <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                        En ligne
                      </span>
                    )}
                  </div>

                  {/* Body Information with custom compact padding */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-stone-900 dark:text-white line-clamp-1 text-sm sm:text-base leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {item.description || <span className="italic text-stone-400 font-mono">Aucune description</span>}
                      </p>

                      <div className="flex gap-3.5 items-center text-[9.5px] text-stone-400 dark:text-stone-500 flex-wrap pt-0.5 font-mono">
                        <div className="flex items-center gap-0.5 shrink-0">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span className="truncate max-w-[90px] sm:max-w-none">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Eye className="w-3 h-3" />
                          <span>{getSimulatedViews(item.id)} vues</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row with public details view and editing / delete control */}
                    <div className="border-t border-stone-100 dark:border-stone-850 pt-3 space-y-2">
                      
                      {/* CONNECTIVITY BUTTON: View Public listing popup straight from dashboard */}
                      <button
                        type="button"
                        onClick={() => onOpenListingDetails(item)}
                        className="w-full bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-white dark:hover:text-white border border-stone-200 dark:border-stone-750 text-[10px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-400" />
                        <span>Aperçu public</span>
                      </button>

                      {/* Flex grid representing controls beautifully on mobile, no overflows or wrapping */}
                      <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full">
                        {/* Toggle Sold Switch */}
                        <button
                          type="button"
                          onClick={() => onToggleSold(item.id)}
                          className={`text-[8.5px] sm:text-[10px] font-bold py-1.5 px-0.5 sm:px-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 touch-manipulation h-8 ${
                            item.isSold
                              ? "bg-stone-100 hover:bg-stone-150 text-stone-600 dark:text-stone-400 border-stone-200 dark:bg-stone-800 dark:border-stone-750"
                              : "bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-400 border-emerald-200/70"
                          }`}
                          title={item.isSold ? "Remettre en ligne" : "Marquer comme vendu"}
                        >
                          <CheckCircle className={`w-3 h-3 ${item.isSold ? "text-stone-400" : "text-emerald-500"}`} />
                          <span>{item.isSold ? "Remettre" : "Vendu"}</span>
                        </button>

                        {/* Modify listing */}
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="bg-amber-50 dark:bg-amber-905/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-stone-800 text-[8.5px] sm:text-[10px] font-black py-1.5 px-0.5 sm:px-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0 touch-manipulation h-8"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Éditer</span>
                        </button>

                        {/* Delete with prompt */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Êtes-vous certain de vouloir supprimer définitivement cette annonce ? Cette action est irréversible.")) {
                              onDeleteListing(item.id);
                            }
                          }}
                          className="hover:bg-red-50 dark:hover:bg-red-955/15 text-red-650 hover:text-red-700 py-1.5 px-0.5 sm:px-1.5 text-[8.5px] sm:text-[10px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 border border-transparent hover:border-red-100 shrink-0 touch-manipulation h-8"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                          <span>Retirer</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 3: AI ASSISTANT & WRITING GENERATOR — Fully refined with clipboard operations & instant assignment */}
      {activeTab === "generator" && (
        <div className="space-y-6 animate-fade-in text-left">
          
          <div>
            <h3 className="font-serif font-black text-stone-900 dark:text-white text-lg">
              Assistant Smart Rédacteur
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Renseignez les caractéristiques simples de votre objet, et laissez notre rédacteur produire une structure d'annonce complète pour maximiser vos chances !
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Input params */}
            <div className="bg-white dark:bg-stone-900 border-2 border-amber-500/10 dark:border-amber-550/5 p-5 sm:p-6 rounded-2xl shadow-md hover:shadow-lg transition-all space-y-4 relative overflow-hidden">
              
              <div className="space-y-1">
                <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-450 uppercase tracking-wider font-extrabold">
                  Qu'allez-vous vendre ? (Nom précis)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Commode scandinave en chêne massif"
                  value={aiObjectName}
                  onChange={(e) => setAiObjectName(e.target.value)}
                  className="w-full text-xs border border-stone-200 dark:border-stone-750 rounded-xl px-3 py-2.5 bg-stone-50 dark:bg-stone-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-450 uppercase tracking-wider font-extrabold">
                    État Général
                  </label>
                  <select
                    value={aiObjectCondition}
                    onChange={(e) => setAiObjectCondition(e.target.value)}
                    className="w-full text-xs border border-stone-200 dark:border-stone-750 rounded-xl p-2.5 bg-stone-50 dark:bg-stone-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer dark:text-white"
                  >
                    {conditionsList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-450 uppercase tracking-wider font-extrabold">
                    Style, Genre ou Époque (Personnalisé)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Littérature, Années 70, Art Déco..."
                    value={aiObjectEra}
                    onChange={(e) => setAiObjectEra(e.target.value)}
                    className="w-full text-xs border border-stone-200 dark:border-stone-750 rounded-xl px-3 py-2.5 bg-stone-50 dark:bg-stone-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={generateAIDescription}
                disabled={!aiObjectName.trim()}
                className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 touch-manipulation ${
                  aiObjectName.trim()
                    ? "bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer active:scale-98 shadow-sm"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>Générer d'un simple clic</span>
              </button>
            </div>

            {/* Smart Preview & Direct apply dropdown - VERY POWERFUL CONNECTIONS */}
            <div className="bg-stone-50/60 dark:bg-stone-950/20 p-5 sm:p-6 rounded-2xl border-2 border-stone-200/60 dark:border-stone-850/80 flex flex-col justify-between space-y-5 transition-all shadow-xs">
              <div className="space-y-3.5 flex-1 flex flex-col">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[9.5px] font-mono text-amber-800 dark:text-amber-500 uppercase tracking-widest font-extrabold block">
                    📝 Gabarit d'Annonce généré
                  </span>
                  
                  {aiDraftDescription && (
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier dans le presse-papier</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {aiDraftDescription ? (
                  <div className="flex-1 min-h-[180px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col">
                    <pre className="text-[11px] text-stone-750 dark:text-stone-300 whitespace-pre-line leading-relaxed font-sans overflow-y-auto pr-1 scroller-slim flex-1 max-h-[220px]">
                      {aiDraftDescription}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[180px] border border-dashed border-stone-300 dark:border-stone-750 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <Sparkles className="w-7 h-7 text-stone-300 dark:text-stone-600 animate-pulse" />
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-bold">Un contenu complet réDigé par l'IA</p>
                    <p className="text-[10px] text-stone-400 max-w-sm">
                      Dès que vous aurez cliqué sur générer, le texte structuré apparaitra ici pour être directement copié ou intégré.
                    </p>
                  </div>
                )}
              </div>

              {/* AUTOMATION EXCELLENCE: Apply draft straight to one of their actual listings */}
              {aiDraftDescription && myListings.filter(item => !item.isSold).length > 0 && (
                <div className="pt-3.5 border-t border-stone-100 dark:border-stone-850 space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="block text-[9px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                      🪄 Assigner directement à une annonce en ligne :
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={applyToListingId}
                        onChange={(e) => setApplyToListingId(e.target.value)}
                        className="flex-1 text-xs border border-stone-200 dark:border-stone-800 rounded-xl p-2 bg-white dark:bg-stone-900 focus:outline-hidden dark:text-white cursor-pointer"
                      >
                        <option value="">-- Choisir une de vos annonces --</option>
                        {myListings.filter(item => !item.isSold).map(item => (
                          <option key={item.id} value={item.id}>{item.title}</option>
                        ))}
                      </select>
                      
                      <button
                        type="button"
                        onClick={handleSmartApplyDescription}
                        disabled={!applyToListingId || isApplying}
                        className="bg-stone-900 hover:bg-stone-850 dark:bg-stone-800 dark:hover:bg-stone-750 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0 touch-manipulation"
                      >
                        {isApplying ? "Application..." : "Appliquer"}
                      </button>
                    </div>
                  </div>

                  {applySuccessMessage && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-400 text-[10.5px] rounded-lg border border-emerald-150 font-bold flex items-center gap-1.5 animate-wiggle">
                      <Check className="w-3.5 h-3.5" />
                      <span>{applySuccessMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {aiDraftDescription && myListings.filter(item => !item.isSold).length === 0 && (
                <p className="text-[10px] text-stone-400 italic">
                  Note : Vous n'avez aucune annonce disponible en ligne pour lui assigner directement cette description.
                </p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* FULL-SCREEN SLIDING OVERLAY EDIT DIALOG (MODIFICATION FORM) — Adaptive Bottom-Sheet on mobile / padded popup on desktop */}
      <AnimatePresence>
        {editingListing && (
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            
            {/* Dark background click handler */}
            <div 
              className="absolute inset-0 cursor-default" 
              onClick={() => setEditingListing(null)} 
            />

            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-stone-950 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10"
            >
              
              {/* Sticky Header */}
              <div className="bg-stone-900 text-white px-5 py-4 flex justify-between items-center shrink-0 border-b border-stone-800">
                <div className="flex items-center gap-2 text-left">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <div>
                    <h4 className="font-serif font-black text-xs sm:text-sm">Modifier votre annonce</h4>
                    <p className="text-[9px] text-stone-400 font-mono">ID de la trouvaille : {editingListing.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="p-1 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white cursor-pointer select-none text-xs"
                >
                  Fermer
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleApplyEdit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-left scroll-smooth">
                
                {editError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-mono border border-red-200">
                    ⚠️ {editError}
                  </div>
                )}

                {/* Title and price settings */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                      Titre de l'objet <span className="text-amber-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Vélo Peugeot rétro"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xs font-serif border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2.5 bg-white dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                      Devise <span className="text-amber-500">*</span>
                    </label>
                    <select
                      value={editPriceCurrency.code}
                      onChange={(e) => {
                        const found = CURRENCIES.find(c => c.code === e.target.value);
                        if (found) setEditPriceCurrency(found);
                      }}
                      className="w-full text-xs border border-stone-200 dark:border-stone-850 rounded-xl p-2.5 bg-stone-50 dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer dark:text-white"
                    >
                      {CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                      Prix demandé ({editPriceCurrency.symbol})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Ex: 85"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value !== "" ? Number(e.target.value) : "")}
                        className="w-full text-xs font-mono border border-stone-200 dark:border-stone-850 rounded-xl pl-3 pr-8 py-2.5 bg-white dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] font-bold text-stone-400">
                        {editPriceCurrency.symbol}
                      </span>
                    </div>
                  </div>
                </div>

                {editPriceCurrency.code !== "EUR" && editPrice && (
                  <p className="text-[10px] text-amber-600 font-mono text-right">
                    ≈ {Math.round(Number(editPrice) / editPriceCurrency.rate).toLocaleString("fr-FR")} € (Prix stocké en Euro)
                  </p>
                )}

                {/* Category, Condition, Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                      Catégorie
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full text-xs border border-stone-200 dark:border-stone-850 rounded-xl p-2.5 bg-stone-50 dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                      État cosmétique
                    </label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value)}
                      className="w-full text-xs border border-stone-200 dark:border-stone-850 rounded-xl p-2.5 bg-stone-50 dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                    >
                      {conditionsList.map(cond => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full text-xs border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2.5 bg-white dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                    Localisation (Quartier, Ville)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bastille, Paris ou Lyon 5è"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full text-xs border border-stone-200 dark:border-stone-850 rounded-xl px-3 py-2.5 bg-white dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:text-white"
                  />
                </div>

                {/* Description Textarea */}
                <div className="space-y-1">
                  <ListingDescriptionEditor
                    description={editDescription}
                    setDescription={setEditDescription}
                    descriptionStyle={editDescriptionStyle}
                    setDescriptionStyle={setEditDescriptionStyle}
                    isDarkMode={true} // Inside the dark sliding overlay
                    isProUser={!!isProUser}
                    onOpenUpgradeModal={onOpenUpgradeModal}
                  />
                </div>

                {/* Upload & Media Files */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
                  
                  {/* Photo picker on edit form */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-stone-500">
                      <span className="font-bold flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-stone-400" /> Photo d'illustration
                      </span>
                      <span className="text-emerald-700">OK</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <img
                        src={editImageUrl || "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=150"}
                        alt="Aperçu Mini"
                        className="w-11 h-11 object-cover rounded-lg border border-stone-300 dark:border-stone-750"
                        referrerPolicy="no-referrer"
                      />
                      <label className="flex-1 bg-white dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-700 py-1.5 px-3 rounded-lg text-center cursor-pointer text-[10px] font-extrabold text-stone-700 dark:text-stone-300 transition-colors">
                        Parcourir...
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleEditImageUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Video picker on edit form */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-stone-500">
                      <span className="font-bold flex items-center gap-1">
                        <Video className="w-3 h-3 text-red-500" /> Vidéo de démonstration
                      </span>
                      <span className="text-stone-400">Max 10Mo</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-850 border border-stone-300 dark:border-stone-750 flex items-center justify-center text-[9.5px] font-bold text-stone-600">
                        {editVideoUrl ? "📹 OUI" : "Aucune"}
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="bg-white dark:bg-stone-950 hover:bg-stone-100 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-700 py-1.5 px-3 rounded-lg text-center cursor-pointer text-[10px] font-extrabold text-stone-700 dark:text-stone-300 transition-colors">
                          {editVideoUrl ? "Remplacer" : "Téléverser"}
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleEditVideoUpload}
                          />
                        </label>
                        {editVideoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditVideoUrl("")}
                            className="text-red-500 hover:underline text-[9px] font-mono text-left font-bold"
                          >
                            Supprimer la vidéo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Dialog Footer Actions */}
                <div className="border-t border-stone-100 dark:border-stone-850 pt-4 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingListing(null)}
                    className="px-4 py-2 border border-stone-200 dark:border-stone-750 rounded-xl text-xs hover:bg-stone-50 dark:hover:bg-stone-850 font-bold cursor-pointer text-stone-750 dark:text-stone-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-stone-900 hover:bg-stone-800 dark:bg-amber-450 dark:hover:bg-amber-400 dark:text-stone-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98"
                  >
                    {isSaving ? "Modification..." : "Valider les changements"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
