import React, { useState, useEffect } from "react";
import { X, Upload, Check, Info, Sparkles } from "lucide-react";
import { CURRENCIES, Currency } from "../utils/currency";
import { motion, AnimatePresence } from "motion/react";
import { ListingDescriptionEditor } from "./ListingDescriptionEditor";


interface CreateListingModalProps {
  currentUserEmail: string;
  currentUserName: string;
  onClose: () => void;
  onSubmit: (listingData: any) => Promise<void>;
  isDarkMode?: boolean;
  isProUser?: boolean;
  onOpenUpgradeModal?: () => void;
}

const CATEGORIES = [
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
  "Neuf",
  "Comme neuf",
  "Très bon état",
  "Bon état",
  "Usagé"
];

// Curated stock photos for the categories in case they don't upload one
const CATEGORY_STOCK_IMAGES: Record<string, string[]> = {
  "Électronique": [
    "https://images.unsplash.com/photo-1546059717-4746924ee43a?auto=format&fit=crop&q=80&w=800", // Phone
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=800", // Laptop
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800"  // Headset
  ],
  "Mode & Vêtements": [
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800", // Clothes rack
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800", // Sneakers
    "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=800"  // Leather bag
  ],
  "Maison & Déco": [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=800", // Bright room
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800", // Interior Lamp
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800"  // Double Bed
  ],
  "Véhicules": [
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800", // Bicycle
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800", // Motorcycle
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"  // Classic Car
  ],
  "Sport & Loisirs": [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800", // Dumbbells
    "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&q=80&w=800", // Hiking
    "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=800"  // Swimming Set
  ],
  "Livres & Culture": [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800", // Books stack
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800", // Vintage Mic
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800"  // Vinyl Records
  ],
  "Jeux & Jouets": [
    "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?auto=format&fit=crop&q=80&w=800", // Chessboard
    "https://images.unsplash.com/photo-1629752187687-3d3c7ea3a21b?auto=format&fit=crop&q=80&w=800", // Wooden blocks
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=800"  // Boardgames
  ],
  "Autres": [
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800", // Celebration
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800", // Generic Art
    "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800"  // Wrapped Gift
  ]
};

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  currentUserEmail,
  currentUserName,
  onClose,
  onSubmit,
  isDarkMode = false,
  isProUser = false,
  onOpenUpgradeModal
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [listingCurrency, setListingCurrency] = useState<Currency>(CURRENCIES[0]);
  const [category, setCategory] = useState("Maison & Déco");
  const [location, setLocation] = useState("Paris (75)");
  const [condition, setCondition] = useState("Très bon état");
  const [isSponsored, setIsSponsored] = useState(false);
  const [descriptionStyle, setDescriptionStyle] = useState("normal");
  
  // Custom new profile fields for the listing
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  
  // Image handling
  const [imageType, setImageType] = useState<"upload" | "stock">("stock");
  const [selectedStockIndex, setSelectedStockIndex] = useState(0);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Video handling
  const [videoType, setVideoType] = useState<"upload" | "url">("url");
  const [uploadedVideoBase64, setUploadedVideoBase64] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  // Seller fields (seeded with current active login profile)
  const [sellerName, setSellerName] = useState(currentUserName || "Inconnu");
  const [sellerPhone, setSellerPhone] = useState("");

  const [loading, setLoading] = useState(false);

  // Sync category changes to update stock previews
  const stockOptions = CATEGORY_STOCK_IMAGES[category] || CATEGORY_STOCK_IMAGES["Autres"];

  useEffect(() => {
    if (imageType === "stock") {
      setImagePreview(stockOptions[selectedStockIndex] || stockOptions[0]);
    } else {
      setImagePreview(uploadedImageBase64 || "");
    }
  }, [category, selectedStockIndex, imageType, uploadedImageBase64, stockOptions]);

  useEffect(() => {
    if (videoType === "url") {
      setVideoPreview(videoUrlInput);
    } else {
      setVideoPreview(uploadedVideoBase64 || "");
    }
  }, [videoType, videoUrlInput, uploadedVideoBase64]);

  // Handle local File selected via system browser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("La taille du fichier ne doit pas dépasser 8 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle multiple extra photos
  const handleAddExtraImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        alert("La taille de chaque photo supplémentaire ne doit pas dépasser 8 Mo.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAdditionalImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveExtraImage = (index: number) => {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle local video file upload
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("La taille de la vidéo ne doit pas dépasser 25 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedVideoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const priceInEur = Number((Number(price) / listingCurrency.rate).toFixed(2));
      const payload = {
        title,
        description,
        price: priceInEur,
        category,
        location,
        condition,
        imageUrl: imagePreview,
        videoUrl: videoPreview,
        size: size || "",
        color: color || "",
        quantity: Number(quantity) || 1,
        additionalImages,
        sellerName,
        sellerEmail: currentUserEmail,
        sellerPhone,
        isSponsored: isProUser ? isSponsored : false,
        descriptionStyle: isProUser ? descriptionStyle : "normal"
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      alert("Une erreur s'est produite lors de la mise en ligne.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden z-10 max-h-[92vh] flex flex-col border transition-colors duration-300 ${
          isDarkMode ? "bg-stone-950 border-stone-850" : "bg-[#fcfbf9] border-stone-200"
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center flex-shrink-0 transition-colors ${
          isDarkMode ? "border-stone-850 bg-stone-900" : "border-stone-200/80 bg-white"
        }`}>
          <div>
            <h3 className={`font-serif text-xl font-bold flex items-center gap-1.5 ${isDarkMode ? "text-stone-100" : "text-stone-900"}`}>
              Vendre un article <Sparkles className="w-5 h-5 text-amber-500 fill-amber-50" />
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-sans">Mettez en ligne n'importe quel objet en moins de 2 minutes !</p>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors p-1.5 rounded-full ${
              isDarkMode ? "text-stone-400 hover:text-white hover:bg-stone-800" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Double Column split: Info & Media */}
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left Box: Text Content Fields */}
            <div className="flex-1 space-y-4 text-left">
              {/* Title */}
              <div>
                <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                  Titre de l'annonce <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vélo Peugeot, Canapé cuir, Clavier Azerty..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors ${
                    isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200 text-stone-900"
                  }`}
                  required
                />
              </div>

              {/* Category, Condition, Price and Currency Choice */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSelectedStockIndex(0);
                    }}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-3xs cursor-pointer ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    Devise <span className="text-amber-500 font-bold">*</span>
                  </label>
                  <select
                    value={listingCurrency.code}
                    onChange={(e) => {
                      const found = CURRENCIES.find(c => c.code === e.target.value);
                      if (found) setListingCurrency(found);
                    }}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 cursor-pointer shadow-3xs ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    Prix ({listingCurrency.symbol}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 45"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono shadow-3xs ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                    required
                  />
                </div>
              </div>
              {listingCurrency.code !== "EUR" && price && !isNaN(Number(price)) && (
                <p className="text-[11px] text-amber-500 font-mono mt-1">
                  ≈ {Math.round(Number(price) / listingCurrency.rate).toLocaleString("fr-FR")} € (Prix de référence stocké en Euro)
                </p>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    État de l'objet
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    Ville ou Code Postal
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Paris (75011)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                  />
                </div>
              </div>

              {/* Product Specifications Section - Requested by user */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5">
                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    Taille / Dimensions
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: XL, 42, 120 x 80 cm"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    Couleur(s)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Noir / Marron écru"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                    Nombre (Quantité disponibles)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <ListingDescriptionEditor
                description={description}
                setDescription={setDescription}
                descriptionStyle={descriptionStyle}
                setDescriptionStyle={setDescriptionStyle}
                isDarkMode={isDarkMode}
                isProUser={isProUser}
                onOpenUpgradeModal={onOpenUpgradeModal}
              />
            </div>

            {/* Right Box: Media Upload / Curating */}
            <div className="md:w-[280px] space-y-4 text-left shrink-0">
              <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Photo principale de l'article <span className="text-red-500">*</span>
              </label>

              {/* Dynamic Image Preview frame */}
              <div className={`relative h-44 rounded-xl border overflow-hidden flex items-center justify-center ${
                isDarkMode ? "border-stone-800 bg-stone-950" : "border-stone-200/90 bg-stone-100"
              }`}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-stone-400">
                    <Upload className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <p className="text-[10px]">Aucun visuel disponible</p>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-3xs text-white px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wide uppercase">
                  Aperçu Principal
                </div>
              </div>

              {/* Methods selector tabs */}
              <div className={`flex rounded-lg border p-0.5 text-xs ${
                isDarkMode ? "border-stone-800 bg-stone-900" : "border-stone-200 bg-stone-100"
              }`}>
                <button
                  type="button"
                  onClick={() => setImageType("stock")}
                  className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all duration-150 cursor-pointer ${
                    imageType === "stock"
                      ? (isDarkMode ? "bg-stone-800 text-stone-100 shadow-sm" : "bg-white text-stone-950 shadow-3xs")
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  Photo Premium
                </button>
                <button
                  type="button"
                  onClick={() => setImageType("upload")}
                  className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all duration-150 cursor-pointer ${
                    imageType === "upload"
                      ? (isDarkMode ? "bg-stone-800 text-stone-100 shadow-sm" : "bg-white text-stone-950 shadow-3xs")
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  Télécharger
                </button>
              </div>

              {/* Switch Content Area */}
              {imageType === "stock" ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-stone-400 leading-snug">
                    <Info className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
                    Pas de photo sous la main ? Sélectionnez un visuel professionnel de notre galerie de démonstration basé sur votre catégorie :
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {stockOptions.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedStockIndex(index)}
                        className={`relative h-12 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          selectedStockIndex === index
                            ? "border-amber-600 ring-1 ring-amber-600"
                            : (isDarkMode ? "border-stone-800 opacity-60 hover:opacity-100" : "border-stone-200 opacity-60 hover:opacity-100")
                        }`}
                      >
                        <img
                          src={url}
                          alt="Option"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {selectedStockIndex === index && (
                          <div className="absolute inset-0 bg-amber-600/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={`relative border-2 border-dashed transition-colors rounded-xl p-4 text-center cursor-pointer ${
                    isDarkMode ? "border-stone-800 bg-stone-900/40 hover:border-amber-500" : "border-stone-200 hover:border-amber-500 bg-white"
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 mx-auto mb-1 text-stone-400" />
                    <p className={`text-[11px] font-medium ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>Changer d'image...</p>
                    <p className="text-[9px] text-stone-400 mt-0.5">PNG, JPG, WEBP jusqu'à 8Mo</p>
                  </div>
                  {uploadedImageBase64 && (
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-mono justify-center">
                      <Check className="w-3.5 h-3.5" /> Fichier chargé avec succès !
                    </p>
                  )}
                </div>
              )}

              {/* ADDITIONAL PHOTOS ATTACHMENT SECTION - Requested by user */}
              <div className={`pt-4 border-t space-y-3 ${isDarkMode ? "border-stone-800" : "border-stone-200/60"}`}>
                <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                  Photos supplémentaires ({additionalImages.length})
                </label>
                
                {additionalImages.length > 0 && (
                  <div className={`grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border ${
                    isDarkMode ? "bg-stone-950/60 border-stone-850" : "bg-stone-100/50 border-stone-200"
                  }`}>
                    {additionalImages.map((src, idx) => (
                      <div key={idx} className="relative h-14 sm:h-16 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-850 bg-stone-950 group">
                        <img 
                          src={src} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        {/* Always-visible delete button for better mobile usability */}
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-all cursor-pointer z-10 flex items-center justify-center"
                          title="Supprimer cette photo"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`relative border border-dashed transition-colors rounded-lg p-2.5 text-center cursor-pointer ${
                  isDarkMode ? "border-stone-800 bg-stone-900/30 hover:border-amber-500" : "border-stone-200 hover:border-amber-500 bg-white"
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddExtraImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 mx-auto mb-1 text-stone-400" />
                  <p className={`text-[10px] font-medium leading-none ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>Ajouter des photos...</p>
                  <p className="text-[8px] text-stone-400 mt-1">Sélection multiple (PNG, JPG jusqu'à 8Mo)</p>
                </div>
              </div>

              {/* VIDEO INTEGRATION SECTION */}
              <div className={`pt-4 border-t space-y-3 ${isDarkMode ? "border-stone-800" : "border-stone-200/60"}`}>
                <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                  Vidéo de l'article (facultatif)
                </label>

                {/* Video preview with active play or placeholder */}
                <div className={`relative h-28 rounded-xl border overflow-hidden flex items-center justify-center ${
                  isDarkMode ? "border-stone-800 bg-stone-950" : "border-stone-200/90 bg-stone-100"
                }`}>
                  {videoPreview ? (
                    <video
                      src={videoPreview}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-stone-400">
                      <svg
                        className="w-6 h-6 mx-auto mb-1 opacity-50 text-stone-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        id="video-none-icon"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 002-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-[9px]">Aucune vidéo</p>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-3xs text-white px-1.5 py-0.5 rounded border border-white/10 text-[8px] font-mono uppercase tracking-wide">
                    Vidéo
                  </div>
                </div>

                {/* Video toggle selector */}
                <div className={`flex rounded-lg border p-0.5 text-xs ${
                  isDarkMode ? "border-stone-800 bg-stone-900" : "border-stone-200 bg-stone-100"
                }`}>
                  <button
                    type="button"
                    onClick={() => setVideoType("url")}
                    className={`flex-1 py-1 text-center font-medium rounded-md transition-all duration-155 cursor-pointer ${
                      videoType === "url"
                        ? (isDarkMode ? "bg-stone-800 text-stone-100 shadow-sm" : "bg-white text-stone-950 shadow-3xs")
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    Lien Vidéo
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType("upload")}
                    className={`flex-1 py-1 text-center font-medium rounded-md transition-all duration-155 cursor-pointer ${
                      videoType === "upload"
                        ? (isDarkMode ? "bg-stone-800 text-stone-100 shadow-sm" : "bg-white text-stone-950 shadow-3xs")
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    Télécharger
                  </button>
                </div>

                {/* Input Switch */}
                {videoType === "url" ? (
                  <div className="space-y-1">
                    <input
                      type="url"
                      placeholder="Ex: https://www.w3schools.com/html/mov_bbb.mp4"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      className={`w-full text-xs border rounded-lg p-2.5 bg-white focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 ${
                        isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                      }`}
                    />
                    <p className="text-[9px] text-stone-400 leading-normal">
                      Insérez un lien direct MP4 ou WebM public.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className={`relative border border-dashed transition-colors rounded-lg p-2 text-center cursor-pointer ${
                      isDarkMode ? "border-stone-800 bg-stone-900/30 hover:border-amber-500" : "border-stone-200 hover:border-amber-500 bg-white"
                    }`}>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <p className={`text-[10px] font-medium ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>Télécharger fichier vidéo...</p>
                      <p className="text-[8px] text-stone-400 mt-0.5">MP4, WebM jusqu'à 25Mo</p>
                    </div>
                    {uploadedVideoBase64 && (
                      <p className="text-[9px] text-emerald-600 flex items-center gap-1 font-mono justify-center">
                        <Check className="w-3 h-3" /> Vidéo chargée avec succès !
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seller / Profile details Verification */}
          <div className={`pt-4 border-t grid grid-cols-2 gap-3.5 p-4 rounded-xl border text-left ${
            isDarkMode ? "border-stone-800 bg-stone-900/40" : "bg-stone-50/50 border-stone-200/50"
          }`}>
            <div className="col-span-2">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                Informations publiques du vendeur
              </h4>
            </div>
            <div>
              <label className={`block text-[10px] font-medium mb-1 ${isDarkMode ? "text-stone-300" : "text-stone-500"}`}>
                Mon nom commercial / Pseudo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className={`w-full text-xs border rounded-lg p-2.5 ${
                  isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-[10px] font-medium mb-1 ${isDarkMode ? "text-stone-300" : "text-stone-500"}`}>
                Numéro de téléphone
              </label>
              <input
                type="text"
                placeholder="Ex: 06 12 34 56..."
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                className={`w-full text-xs border rounded-lg p-2.5 font-mono ${
                  isDarkMode ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200"
                }`}
              />
            </div>
          </div>

          {/* Option de mise en avant PRO / Sponsorisation */}
          <div className={`p-4 rounded-xl border text-left transition-colors ${
            isSponsored 
              ? "bg-amber-450/15 border-amber-350 dark:border-amber-500/30" 
              : isDarkMode ? "border-stone-800 bg-stone-900/10" : "bg-stone-50/20 border-stone-200/60"
          }`}>
            {isProUser ? (
              <div className="flex items-start gap-3.5">
                <input
                  type="checkbox"
                  id="pro-sponsor-checkbox"
                  checked={isSponsored}
                  onChange={(e) => setIsSponsored(e.target.checked)}
                  className="w-4 h-4 rounded mt-1 accent-amber-500 text-stone-950 focus:ring-amber-500 border-stone-300 cursor-pointer"
                />
                <label htmlFor="pro-sponsor-checkbox" className="select-none cursor-pointer flex-1 text-xs">
                  <span className="font-serif font-black uppercase text-stone-900 dark:text-white flex items-center gap-1.5 leading-none">
                    🚀 Sponsoriser cette annonce (Avantage PRO gratuit)
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-normal">
                    En cochant cette case, votre annonce sera boostée au sommet du marché des voisins, bénéficiera d'un encadré brillant doré et d'un badge premium tape-à-l'œil pour maximiser vos contacts.
                  </p>
                </label>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-left space-y-1 flex-1">
                  <span className="font-serif font-black uppercase text-stone-450 dark:text-stone-400 text-xs flex items-center gap-1.5 opacity-80">
                    🔒 Option de Visibilité Boostée (Sponsorisé PRO)
                  </span>
                  <p className="text-[10.5px] text-stone-400 leading-normal">
                    Réservé aux membres Brocante PRO. Mettez vos trouvailles en avant tout en haut du marché avec des cadres animés et multipliez vos prises par dix !
                  </p>
                </div>
                {onOpenUpgradeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenUpgradeModal();
                    }}
                    className="px-3.5 py-1.5 bg-stone-900 dark:bg-stone-800 hover:bg-black text-amber-400 hover:text-white font-mono text-[10px] uppercase font-black tracking-wide rounded-lg cursor-pointer transition shrink-0"
                  >
                    🚀 Activer PRO
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className={`pt-3 flex gap-3 justify-end border-t ${isDarkMode ? "border-stone-850" : "border-transparent"}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDarkMode ? "border-stone-800 text-stone-300 hover:bg-stone-900" : "border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`text-xs font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
                loading
                  ? (isDarkMode ? "bg-stone-800 text-stone-500" : "bg-stone-300 text-white")
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {loading ? "Création..." : "Publier l'annonce maintenant"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
