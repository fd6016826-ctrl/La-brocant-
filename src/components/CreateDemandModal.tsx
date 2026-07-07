import React, { useState, useEffect } from "react";
import { X, Upload, Check, Info, AlertCircle, ShoppingBag } from "lucide-react";
import { CURRENCIES, Currency } from "../utils/currency";
import { motion, AnimatePresence } from "motion/react";

interface CreateDemandModalProps {
  currentUserEmail: string;
  currentUserName: string;
  onClose: () => void;
  onSubmit: (demandData: any) => Promise<void>;
  isDarkMode?: boolean;
  selectedCurrency?: Currency;
}

const STOCK_DEMAND_IMAGES = [
  "https://images.unsplash.com/photo-1546059717-4746924ee43a?auto=format&fit=crop&q=80&w=800", // Vintage phone/electronics
  "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800", // Clothes
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800", // Deco/interior
  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800", // Bicycle/vehicle
  "https://images.unsplash.com/photo-1566694271453-390536dd1f0d?auto=format&fit=crop&q=80&w=800", // Games & chessboard
];

export const CreateDemandModal: React.FC<CreateDemandModalProps> = ({
  currentUserEmail,
  currentUserName,
  onClose,
  onSubmit,
  isDarkMode = false,
  selectedCurrency,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [desiredPrice, setDesiredPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [otherSpecs, setOtherSpecs] = useState("");
  const [demandCurrency, setDemandCurrency] = useState<Currency>(() => {
    return selectedCurrency || CURRENCIES[0];
  });

  // Image Upload or Stock selection
  const [imageType, setImageType] = useState<"upload" | "stock">("stock");
  const [selectedStockIndex, setSelectedStockIndex] = useState(0);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMess, setErrorMess] = useState<string | null>(null);

  useEffect(() => {
    if (imageType === "stock") {
      setImagePreview(STOCK_DEMAND_IMAGES[selectedStockIndex]);
    } else {
      setImagePreview(uploadedImageBase64 || "");
    }
  }, [imageType, selectedStockIndex, uploadedImageBase64]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert("La taille de l'image ne doit pas dépasser 8 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImageBase64(reader.result as string);
      setImageType("upload");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess(null);

    if (!title.trim()) {
      setErrorMess("Veuillez saisir le nom du produit recherché.");
      return;
    }
    if (!desiredPrice || parseFloat(desiredPrice) <= 0) {
      setErrorMess("Veuillez saisir un prix désiré valide supérieur à 0.");
      return;
    }
    const qtyVal = parseInt(quantity, 10);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setErrorMess("Veuillez saisir une quantité supérieure à 0.");
      return;
    }

    setLoading(true);
    try {
      const finalImage = imageType === "stock" ? STOCK_DEMAND_IMAGES[selectedStockIndex] : uploadedImageBase64;
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        desiredPrice: Number((parseFloat(desiredPrice) / demandCurrency.rate).toFixed(2)),
        quantity: qtyVal,
        size: size.trim(),
        color: color.trim(),
        otherSpecs: otherSpecs.trim(),
        imageUrl: finalImage,
        buyerName: currentUserName,
        buyerEmail: currentUserEmail,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMess("Erreur lors de la publication de la recherche d'achat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-stone-950/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl border-4 border-black text-stone-900 shadow-2xl overflow-hidden flex flex-col my-8"
      >
        {/* UPPER TITLE DECORATION (Amber & Black Header) */}
        <div className="bg-amber-600 text-white px-6 py-4 border-b-4 border-black flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-black p-1.5 rounded-lg border border-white">
              <ShoppingBag className="w-5 h-5 text-amber-400 stroke-[2.5px]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-black uppercase tracking-tight">Publier une Demande d'Achat</h2>
              <p className="text-[10px] font-mono text-stone-100 uppercase tracking-wider">
                Cette recherche apparaîtra en tête d'affiche du marché citoyen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black hover:bg-stone-900 border-2 border-white rounded-xl text-white transition-all cursor-pointer hover:rotate-90 duration-200"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENU */}
        <form onSubmit={handleFormSubmit} className="p-6 md:p-8 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {errorMess && (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-800 font-medium">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMess}</span>
            </div>
          )}

          {/* SECTION 1: L'OBJET RECHERCHÉ */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-bold border-b-2 border-stone-200 pb-1 text-black uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-4 bg-amber-600 inline-block"></span>
              Quel article recherchez-vous ?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">
                  Nom du produit <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Canapé Roche Bobois, Vélo de ville vintage..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-semibold py-3 px-4 border-2 border-black rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-600/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">
                  Catégorie de référence
                </label>
                <select
                  className="w-full text-xs font-bold py-3 px-4 border-2 border-black rounded-xl bg-stone-50 focus:outline-hidden"
                  onChange={(e) => {
                    // Update index if category changes to keep stock photos matching
                    setSelectedStockIndex(0);
                  }}
                >
                  <option>Maison & Déco</option>
                  <option>Mode & Vêtements</option>
                  <option>Électronique</option>
                  <option>Vie Pratique & Véhicules</option>
                  <option>Sport, Loisirs & Culture</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Petite introduction ou justification de votre recherche
              </label>
              <textarea
                placeholder="Décrivez en quelques mots pourquoi vous cherchez cet objet, son utilité ou vos goûts..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full text-xs font-medium py-2.5 px-4 border-2 border-black rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-600/30"
              />
            </div>
          </div>

          {/* SECTION 2: BUDGET & CRITÈRES */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-bold border-b-2 border-stone-200 pb-1 text-black uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-4 bg-amber-600 inline-block"></span>
              Spécifications de l'achat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-stone-700 block">
                  Devise <span className="text-amber-600">*</span>
                </label>
                <select
                  value={demandCurrency.code}
                  onChange={(e) => {
                    const found = CURRENCIES.find(c => c.code === e.target.value);
                    if (found) setDemandCurrency(found);
                  }}
                  className="w-full text-xs font-bold py-3 px-3 border-2 border-black rounded-xl bg-stone-50 focus:outline-hidden cursor-pointer"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-stone-700 block">
                  Budget ({demandCurrency.symbol}) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ex: 150"
                  value={desiredPrice}
                  onChange={(e) => setDesiredPrice(e.target.value)}
                  className="w-full text-xs font-bold py-3 px-4 border-2 border-black rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden"
                />
                {demandCurrency.code !== "EUR" && desiredPrice && !isNaN(Number(desiredPrice)) && (
                  <p className="text-[10px] text-amber-600 font-mono mt-0.5 leading-tight">
                    ≈ {Math.round(Number(desiredPrice) / demandCurrency.rate).toLocaleString("fr-FR")} €
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-stone-700 block">
                  Quantité <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-xs font-bold py-3 px-4 border-2 border-black rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-stone-700 block">
                  Taille souhaitée
                </label>
                <input
                  type="text"
                  placeholder="Ex: L, XL, 39, 120x80cm..."
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full text-xs font-bold py-3 px-4 border-2 border-black rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">
                  Option (Couleur souhaitée)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Marron foncé, bleu marine, peu importe..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full text-xs font-semibold py-3 px-4 border-2 border-black rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 block">
                  Autres exigences de qualité
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pièces d'origine, état neuf uniquement..."
                  value={otherSpecs}
                  onChange={(e) => setOtherSpecs(e.target.value)}
                  className="w-full text-xs font-semibold py-3 px-4 border-2 border-black rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: IMAGE DU PRODUIT EXEMPLE */}
          <div className="space-y-4">
            <h3 className="font-serif text-sm font-bold border-b-2 border-stone-200 pb-1 text-black uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-4 bg-amber-600 inline-block"></span>
              Photo de référence de l'article recherché
            </h3>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setImageType("stock")}
                className={`text-xs font-bold px-4 py-2 rounded-xl border-2 transition-colors cursor-pointer ${
                  imageType === "stock"
                    ? "bg-black text-white border-black"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                Parmi nos suggestions
              </button>
              <button
                type="button"
                onClick={() => setImageType("upload")}
                className={`text-xs font-bold px-4 py-2 rounded-xl border-2 transition-colors cursor-pointer ${
                  imageType === "upload"
                    ? "bg-black text-white border-black"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                Importer ma propre photo
              </button>
            </div>

            {imageType === "stock" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2.5">
                  {STOCK_DEMAND_IMAGES.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedStockIndex(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedStockIndex === idx ? "border-amber-500 ring-2 ring-amber-500/20 scale-102" : "border-stone-200 grayscale-60 opacity-80 hover:grayscale-0 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      {selectedStockIndex === idx && (
                        <div className="absolute inset-0 bg-amber-600/10 flex items-center justify-center">
                          <Check className="w-5 h-5 text-amber-600 bg-white rounded-full p-0.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`border-4 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-colors relative ${
                  dragActive ? "border-amber-500 bg-amber-50/50" : "border-stone-300 bg-stone-50 hover:bg-stone-100"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("demand-file-input")?.click()}
              >
                <input
                  type="file"
                  id="demand-file-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                <p className="text-xs font-bold text-stone-700">Déposer ou cliquer pour importer</p>
                <p className="text-[10px] text-stone-400 mt-1">Format PNG, JPG inférieur à 8 Mo</p>
              </div>
            )}

            {imagePreview && (
              <div className="border border-stone-200 rounded-2xl overflow-hidden max-w-sm mx-auto aspect-video relative shadow-xs bg-stone-100">
                <img src={imagePreview} className="w-full h-full object-cover" alt="Avis de recherche" referrerPolicy="no-referrer" />
                <div className="absolute top-2 left-2 bg-black/75 text-white font-mono text-[9px] px-2 py-0.5 rounded-md">
                  Prévisualisation de l'annonce d'achat
                </div>
              </div>
            )}
          </div>

          {/* SECTION D'INFORMATION CITOYENNE */}
          <div className="bg-stone-900 text-white rounded-2xl p-4 flex gap-3 border-l-4 border-amber-500">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Annonceur public citoyen :</p>
              <p className="text-stone-300 leading-relaxed font-mono">
                Rédigé sous l'identité de <strong>{currentUserName}</strong> ({currentUserEmail}). Les vendeurs du marché pourront cliquer sur votre annonce pour vous envoyer directement une offre de négociation.
              </p>
            </div>
          </div>

          {/* BOUTON D'ACTION PRINCIPALE (Amber & Black border & text-white) */}
          <div className="pt-2 border-t-2 border-stone-100">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 bg-amber-600 hover:bg-amber-750 border-4 border-black text-white font-black uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50`}
            >
              {loading ? (
                <span>Publication en cours...</span>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[3px]" />
                  <span>Publier mon avis de recherche d'achat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
