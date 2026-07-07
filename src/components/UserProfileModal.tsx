import React from "react";
import { X, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getRatingForUser, getReviewsForUser } from "../utils/reviews";

interface UserProfileModalProps {
  name: string;
  email: string;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  name,
  email,
  onClose,
  isDarkMode = false,
}) => {
  const { rating, count } = getRatingForUser(email);
  const reviews = getReviewsForUser(email);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-950/80 cursor-pointer"
        />

        {/* Modal content dialog popup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className={`relative max-w-md w-full rounded-2xl shadow-2xl border p-6 z-10 text-left flex flex-col focus:outline-hidden transition-colors duration-300 ${
            isDarkMode 
              ? "bg-stone-900 border-stone-800 text-stone-100" 
              : "bg-white border-stone-200 text-stone-900"
          }`}
        >
          {/* Header Close */}
          <div className={`flex items-center justify-between pb-3.5 border-b ${isDarkMode ? "border-stone-800" : "border-stone-150"}`}>
            <div className="flex items-center gap-1.5">
              <span className="bg-amber-100 text-amber-970 border border-amber-200 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Profil Citoyen Vérifié
              </span>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDarkMode 
                  ? "text-stone-400 hover:text-white hover:bg-stone-800" 
                  : "text-stone-400 hover:text-stone-850 hover:bg-stone-100"
              }`}
              title="Fermer le profil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile basic profile card */}
          <div className={`py-5 flex flex-col items-center text-center space-y-3 rounded-xl border p-4 mt-4 transition-colors ${
            isDarkMode 
              ? "bg-stone-950/40 border-stone-800" 
              : "bg-gradient-to-b from-stone-50 to-white border-stone-100"
          }`}>
            <div className="w-16 h-16 rounded-full bg-[#fcd462] text-stone-950 font-serif font-black text-3xl flex items-center justify-center shadow-md">
              {name.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h3 className={`font-serif text-lg font-black tracking-tight ${isDarkMode ? "text-stone-100" : "text-stone-905"}`}>{name}</h3>
              <p className="text-[11px] text-stone-450 font-mono mt-0.5">{email}</p>
            </div>

            {/* Note details */}
            <div className="flex items-center gap-3 pt-1">
              <div className={`border rounded-xl px-3 py-1.5 text-center ${isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-amber-50 border-amber-200/50"}`}>
                <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none">Note Globale</p>
                <p className="font-mono text-base font-bold text-amber-500 mt-1">
                  ⭐ {rating} / 5
                </p>
              </div>
              <div className={`border rounded-xl px-3 py-1.5 text-center ${isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-201/60"}`}>
                <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none">Retours</p>
                <p className={`font-mono text-sm font-bold mt-1.5 ${isDarkMode ? "text-stone-100" : "text-stone-900"}`}>
                  {count} avis
                </p>
              </div>
            </div>

            {/* Verification status label badge */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100/60 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold">
                ✓ Identité Certifiée
              </span>
              <span className="bg-sky-50 text-sky-700 border border-sky-100/60 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold">
                👥 Voisin de confiance
              </span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="mt-5 space-y-3">
            <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
              Derniers avis de la communauté ({Math.min(3, reviews.length)})
            </h4>
            
            <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
              {reviews.length === 0 ? (
                <div className={`p-4 rounded-xl border border-dashed text-xs text-stone-400 text-center ${isDarkMode ? "border-stone-800" : "border-stone-200"}`}>
                  Aucun avis n'a été laissé pour ce citoyen.
                </div>
              ) : (
                reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className={`p-2.5 rounded-xl border text-xs transition-colors ${
                    isDarkMode ? "bg-stone-950/30 border-stone-850" : "bg-stone-50 border-stone-150"
                  }`}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`font-semibold ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>{r.senderName}</span>
                      <span className="text-[9px] text-stone-400 font-mono font-medium">{r.date}</span>
                    </div>
                    <div className="text-amber-500 text-[10px] mb-1 font-mono">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                    <p className={`font-medium italic leading-relaxed ${isDarkMode ? "text-stone-300" : "text-stone-605"}`}>
                      "{r.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer action button */}
          <button
            onClick={onClose}
            className={`mt-6 w-full font-bold text-xs py-3 rounded-xl transition duration-150 cursor-pointer text-center outline-hidden border-0 ${
              isDarkMode 
                ? "bg-amber-500 hover:bg-amber-600 text-stone-950" 
                : "bg-stone-900 hover:bg-stone-800 text-white"
            }`}
          >
            Fermer le Profil
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
