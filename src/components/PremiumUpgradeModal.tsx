import React, { useState } from "react";
import { 
  Sparkles, 
  Check, 
  Lock, 
  CreditCard, 
  ShieldCheck, 
  TrendingUp, 
  Star, 
  Bell, 
  VolumeX, 
  ChevronRight, 
  X,
  Crown
} from "lucide-react";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserName: string;
  onUpgradeSuccess: () => void;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserName,
  onUpgradeSuccess
}) => {
  const [step, setStep] = useState<"features" | "payment" | "success">("features");
  const isProUser = currentUserEmail ? localStorage.getItem(`brocante_pro_${currentUserEmail.toLowerCase()}`) === "true" : false;
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState(currentUserName || "Chineur Professionnel");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"paytech" | "card">("paytech");
  const [mobileOperator, setMobileOperator] = useState<"wave" | "orange">("wave");

  if (!isOpen) return null;

  const handlePayTechSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/payment/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: currentUserEmail })
      });

      const data = await response.json();
      if (response.ok && data.success && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setErrorMsg(data.error || "Une erreur est survenue lors de l'appel à PayTech.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("PayTech subscription request failed:", err);
      setErrorMsg("Connexion impossible au serveur pour initier le paiement.");
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
      setErrorMsg("Veuillez remplir tous les champs de paiement simulé.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");

    // Simulate payment authorization
    setTimeout(() => {
      try {
        localStorage.setItem(`brocante_pro_${currentUserEmail.toLowerCase()}`, "true");
        setIsSubmitting(false);
        setStep("success");
        onUpgradeSuccess();
      } catch (err) {
        setIsSubmitting(false);
        setErrorMsg("Erreur lors de l'activation de l'abonnement. Veuillez réessayer.");
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border-4 border-amber-400 dark:border-amber-500 shadow-2xl overflow-hidden flex flex-col justify-between max-h-[90vh]">
        
        {/* Banner decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-2xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-stone-200/40 dark:bg-stone-800/40 rounded-full blur-2xl -z-10 pointer-events-none" />

        {/* Header bar */}
        <div className="p-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 bg-amber-450 dark:bg-amber-500 rounded-lg text-stone-950 font-black text-[10px] tracking-widest uppercase flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>Membre PRO</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content container based on Step */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === "features" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="font-serif text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  Choisissez votre Forfait Brocante
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Utilisez les fonctionnalités gratuites ou débloquez la puissance maximale avec l'abonnement PRO.
                </p>
              </div>

              {/* Plans side-by-side grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* STANDARD CARD */}
                <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/20 flex flex-col justify-between text-left relative overflow-hidden">
                  {!isProUser && (
                    <span className="absolute top-2.5 right-2.5 bg-stone-600 text-white font-mono text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Actif
                    </span>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif font-black text-stone-850 dark:text-stone-200 uppercase tracking-wide text-xs sm:text-sm">
                        Forfait Standard
                      </h3>
                      <p className="text-[10px] text-stone-400 mt-1">Ventes et échanges occasionnels</p>
                    </div>
                    <div className="py-2 border-y border-dashed border-stone-200 dark:border-stone-800">
                      <span className="font-serif font-black text-lg sm:text-xl text-stone-900 dark:text-white">Gratuit</span>
                      <span className="text-[10px] text-stone-400"> / toujours</span>
                    </div>
                    <ul className="space-y-2 text-[10.5px] text-stone-600 dark:text-stone-400">
                      <li className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-500">
                        ⚠️ Max 5 annonces actives
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-500">
                        ⚠️ Max 10 messages par chat
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 line-through">
                        ❌ Styles de texte personnalisés
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 line-through">
                        ❌ Annonces Sponsorisées Boostées
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 line-through">
                        ❌ Édition de factures PDF
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 line-through">
                        ❌ Recherches d'Achat Citoyennes
                      </li>
                      <li className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 line-through">
                        ❌ Création & Partage d'annonces par IA
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-2">
                    {!isProUser ? (
                      <div className="w-full py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-bold text-[10px] uppercase text-center rounded-xl">
                        ✓ Forfait actuel
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            localStorage.setItem(`brocante_pro_${currentUserEmail.toLowerCase()}`, "false");
                            window.location.reload();
                          } catch (e) {}
                        }}
                        className="w-full py-2 border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-mono font-bold text-[10px] uppercase text-center rounded-xl transition cursor-pointer"
                      >
                        Basculer vers Gratuit
                      </button>
                    )}
                  </div>
                </div>

                {/* PRO CARD */}
                <div 
                  className="p-5 rounded-2xl border-2 border-amber-400 dark:border-amber-500 bg-stone-900/40 flex flex-col justify-between text-left relative overflow-hidden"
                  style={{ backgroundColor: "#291209" }}
                >
                  {isProUser && (
                    <span className="absolute top-2.5 right-2.5 bg-amber-500 text-stone-950 font-mono text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Actif
                    </span>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif font-black text-amber-450 uppercase tracking-wide text-xs sm:text-sm flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 fill-current animate-pulse text-amber-500" />
                        <span>Brocante PRO</span>
                      </h3>
                      <p className="text-[10px] text-amber-200/60 mt-1">Multipliez vos ventes par 10</p>
                    </div>
                    <div className="py-2 border-y border-dashed border-amber-900/30">
                      <span className="font-serif font-black text-lg sm:text-xl text-white">4,99 € (soit 3 270 F CFA)</span>
                      <span className="text-[10px] text-stone-300"> / mois</span>
                    </div>
                    <ul className="space-y-2 text-[10.5px] text-stone-200">
                      <li className="flex items-center gap-1.5 font-bold text-amber-400">
                        ✓ Annonces illimitées
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-amber-400">
                        ✓ Messagerie illimitée
                      </li>
                      <li className="flex items-center gap-1.5">
                        ✓ Recherches d'Achat Citoyennes
                      </li>
                      <li className="flex items-center gap-1.5">
                        ✓ Annonces Sponsorisées Boostées
                      </li>
                      <li className="flex items-center gap-1.5">
                        ✓ Édition de factures PDF
                      </li>
                      <li className="flex items-center gap-1.5">
                        ✓ Styles de texte personnalisés
                      </li>
                      <li className="flex items-center gap-1.5">
                        ✓ Statistiques Vendeur Avancées
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-amber-400">
                        ✓ Création & Partage d'annonces par IA
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-2">
                    {isProUser ? (
                      <div className="w-full py-2 bg-amber-500 text-stone-950 font-mono font-black text-[10px] uppercase text-center rounded-xl">
                        ✓ Abonnement PRO Actif
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStep("payment")}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-450 text-stone-950 font-mono font-black text-[10px] uppercase text-center rounded-xl transition cursor-pointer shadow-md"
                      >
                        S'abonner maintenant
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing teaser / Trust badge */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950/30 border border-stone-150 dark:border-stone-850 rounded-xl flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[10px] text-stone-500 leading-normal text-left">
                  Abonnement mensuel sans engagement. Annulation possible à tout moment en un clic.
                </p>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="font-serif text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  Paiement Mensuel Sécurisé
                </h2>
                <p className="text-xs text-stone-400">
                  Choisissez votre méthode de paiement.
                </p>
              </div>

              {/* Onglets de sélection du moyen de paiement */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-850 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paytech")}
                  className={`py-2 text-xs font-mono font-bold uppercase rounded-lg transition cursor-pointer ${
                    paymentMethod === "paytech"
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  }`}
                >
                  📱 Mobile Money (Wave / OM)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-2 text-xs font-mono font-bold uppercase rounded-lg transition cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  }`}
                >
                  💳 Carte (Simulé)
                </button>
              </div>

              {paymentMethod === "paytech" ? (
                // Formulaire PayTech (Wave / Orange Money)
                <form onSubmit={handlePayTechSubmit} className="space-y-5">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium border border-red-200 dark:border-red-900/30">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <div className="p-4 bg-stone-50 dark:bg-stone-950/25 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4">
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal text-left">
                      Paiement géré de manière 100% sécurisée par la passerelle **PayTech**. Vos fonds seront débités directement depuis votre compte mobile.
                    </p>

                    {/* Boutons de sélection d'opérateur */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMobileOperator("wave")}
                        className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          mobileOperator === "wave"
                            ? "border-sky-400 bg-sky-500/10 dark:bg-sky-500/5 text-sky-500"
                            : "border-stone-200 dark:border-stone-800 hover:border-sky-300 text-stone-400"
                        }`}
                      >
                        <span className="text-xl">🌊</span>
                        <span className="font-mono font-bold text-[10px] uppercase tracking-wider">Wave Senegal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMobileOperator("orange")}
                        className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          mobileOperator === "orange"
                            ? "border-orange-400 bg-orange-500/10 dark:bg-orange-500/5 text-orange-500"
                            : "border-stone-200 dark:border-stone-800 hover:border-orange-300 text-stone-400"
                        }`}
                      >
                        <span className="text-xl">🍊</span>
                        <span className="font-mono font-bold text-[10px] uppercase tracking-wider">Orange Money</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition shadow-xl shrink-0 flex items-center justify-center gap-2 border border-solid ${
                      mobileOperator === "orange"
                        ? "bg-orange-600 hover:bg-orange-550 border-orange-700"
                        : "bg-sky-500 hover:bg-sky-450 border-sky-600"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Redirection vers PayTech...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Payer avec {mobileOperator === "orange" ? "Orange Money" : "Wave"}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Formulaire actuel de Carte Bancaire Simulé
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium border border-red-200 dark:border-red-900/30">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono text-stone-400 uppercase font-bold">Nom du Titulaire de la Carte</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Marc Dupuis"
                      className="w-full bg-stone-50 dark:bg-stone-850 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono text-stone-400 uppercase font-bold">Numéro de Carte de Crédit Simulé</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                        <CreditCard className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                          const parts = val.match(/.{1,4}/g);
                          setCardNumber(parts ? parts.join(" ") : val);
                        }}
                        placeholder="4000 1234 5678 9010"
                        className="w-full bg-stone-50 dark:bg-stone-850 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-stone-400 uppercase font-bold">Expiration (MM/AA)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (val.length >= 2) {
                            setCardExpiry(val.slice(0, 2) + "/" + val.slice(2));
                          } else {
                            setCardExpiry(val);
                          }
                        }}
                        placeholder="12/28"
                        className="w-full bg-stone-50 dark:bg-stone-850 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center focus:ring-1 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-stone-400 uppercase font-bold">Code CVV / Securité</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        placeholder="•••"
                        className="w-full bg-stone-50 dark:bg-stone-850 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center focus:ring-1 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-stone-950 border border-amber-200 dark:border-stone-850 rounded-xl flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-[10px] text-stone-500 leading-normal">
                      <span className="font-bold text-stone-800 dark:text-stone-300">Sandbox d'intégration :</span> Aucun frais réel ne sera débité de votre carte. Ce paiement sert uniquement à valider l'expérience applicative du forfait.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-450 hover:bg-amber-400 disabled:bg-stone-300 text-stone-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition shadow-xl shrink-0 flex items-center justify-center gap-2 touch-manipulation border border-solid"
                    style={{ borderColor: "#867b76", backgroundColor: "#312e2e" }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span style={{ color: "#d07244" }}>Validation en cours...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" style={{ borderColor: "#ad6e4f", color: "#d0805e" }} />
                        <span style={{ color: "#d07244" }}>Activer mes Avantages PRO !</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-stone-950 scale-110 shadow-lg animate-bounce">
                <Crown className="w-8 h-8 fill-current" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-xl sm:text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                  Félicitations {currentUserName} ! 🎉
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Votre compte <span className="font-bold font-mono text-stone-800 dark:text-white">{currentUserEmail}</span> est maintenant <span className="text-amber-550 dark:text-amber-450 font-bold underline font-serif">Brocante PRO</span> !
                </p>
              </div>

              <p className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[11px] sm:text-xs rounded-2xl max-w-sm mx-auto leading-normal font-medium">
                Vous avez désormais un accès illimité aux Recherches d'Achat Citoyennes, à la création et au partage d'annonces par IA, au mode "Sponsorisé" sur vos fiches, et aux rapports de consultations !
              </p>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white font-mono font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Commencer l'expérience PRO
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step !== "success" && (
          <div className="p-5 border-t border-stone-100 dark:border-stone-850 bg-stone-50 dark:bg-stone-950/35 flex justify-between items-center">
            {step === "features" ? (
              <>
                <button
                  onClick={onClose}
                  className="text-[11px] text-stone-400 hover:text-stone-600 font-semibold"
                >
                  Plus tard
                </button>
                <button
                  onClick={() => setStep("payment")}
                  className="px-4 py-2 bg-amber-450 hover:bg-amber-400 text-stone-950 font-mono font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md"
                  style={{ borderColor: "#fe9a00", color: "#fe9a00" }}
                >
                  <span>S'abonner maintenant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep("features")}
                  className="text-[11px] text-stone-400 hover:text-stone-600 font-semibold cursor-pointer"
                >
                  ← Retour aux avantages
                </button>
                <div className="text-[10px] font-mono text-stone-400 font-bold">
                  Sandboxed SECURE 🔒
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
