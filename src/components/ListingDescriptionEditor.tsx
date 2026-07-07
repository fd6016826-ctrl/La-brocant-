import React from "react";
import { Sparkles, Smile, ShieldAlert, ArrowUpRight, Check, Palette } from "lucide-react";
import { getDescriptionStyleConfig } from "../utils/styleHelper";

interface ListingDescriptionEditorProps {
  description: string;
  setDescription: (val: string) => void;
  descriptionStyle: string;
  setDescriptionStyle: (style: string) => void;
  isDarkMode: boolean;
  isProUser: boolean;
  onOpenUpgradeModal?: () => void;
}

export const ListingDescriptionEditor: React.FC<ListingDescriptionEditorProps> = ({
  description,
  setDescription,
  descriptionStyle,
  setDescriptionStyle,
  isDarkMode,
  isProUser,
  onOpenUpgradeModal
}) => {
  const PRESETS = [
    { id: "normal", label: "📄 Standard", desc: "Sans fioritures" },
    { id: "vintage-serif", label: "📜 Cabinet Écrivain", desc: "Sépia doux & Italique" },
    { id: "modern-mono", label: "⚙️ Brut Technologique", desc: "Monospace & Vert" },
    { id: "handwritten", label: "✍️ Esprit Manuscrit", desc: "Cursive soulignée" },
    { id: "neon-glow", label: "📰 Gazette Rétro", desc: "Contrasté Or & Double cadre" }
  ];

  const handleSelectStyle = (presetId: string) => {
    if (presetId === "normal") {
      setDescriptionStyle("normal");
      return;
    }

    if (!isProUser) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
      }
      return;
    }

    setDescriptionStyle(presetId);
  };

  const activeStyleConfig = getDescriptionStyleConfig(descriptionStyle, isDarkMode);

  return (
    <div className="space-y-3.5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
          Éditeur de description stylisée
        </label>
        
        {/* PRO / Free Indicator inside editor header */}
        <div className="flex items-center gap-1.5 uppercase font-mono text-[9px] font-bold">
          {isProUser ? (
            <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-300/30 flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>Texte PRO débloqué</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onOpenUpgradeModal && onOpenUpgradeModal()}
              className="bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 text-stone-500 hover:text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition"
            >
              <span>🔒 Style personnalisé : PRO</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Styled text writer preset selection bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-150 dark:border-stone-850 rounded-xl relative">
        {PRESETS.map((p) => {
          const isSelected = descriptionStyle === p.id;
          const isLocked = p.id !== "normal" && !isProUser;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectStyle(p.id)}
              className={`px-3 py-2 text-[10.5px] rounded-lg font-bold flex flex-col items-start transition-all cursor-pointer select-none text-left relative flex-1 min-w-[124px] ${
                isSelected
                  ? isDarkMode
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500"
                    : "bg-stone-900 text-white border border-stone-900 shadow-3xs"
                  : isDarkMode 
                    ? "bg-stone-900/50 hover:bg-stone-900 border border-stone-800 text-stone-400"
                    : "bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{p.label}</span>
                {isLocked && <span className="text-[9px] text-amber-600">🔒</span>}
                {isSelected && <Check className="w-3 h-3 text-amber-500" />}
              </span>
              <span className="text-[9px] text-stone-400 font-normal mt-0.5 line-clamp-1 block">
                {p.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Actual textarea editor */}
      <div className="relative">
        <textarea
          placeholder="Décrivez l'état de l'objet, ses dimensions, son histoire... et découvrez son rendu en direct ci-dessous."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className={`w-full text-sm border rounded-xl p-3 focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all ${
            isDarkMode 
              ? "bg-stone-900 border-stone-800 text-stone-100" 
              : "bg-white border-stone-200 text-stone-900"
          }`}
        />
        {descriptionStyle !== "normal" && (
          <span className="absolute bottom-2.5 right-2.5 bg-stone-900/40 backdrop-blur-xs text-[8px] font-mono text-amber-200 px-1.5 py-0.5 rounded border border-white/5 pointer-events-none select-none uppercase tracking-wide">
            Style actif : {activeStyleConfig.label}
          </span>
        )}
      </div>

      {/* Styled Real-time Live Preview Panel (Only displayed when there's text typed) */}
      {description.trim().length > 0 && (
        <div className="space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-stone-400 font-semibold tracking-wider">
            <Palette className="w-3.5 h-3.5 text-stone-400" />
            <span>Aperçu de votre annonce de gré à gré</span>
          </div>
          
          <div 
            className="whitespace-pre-line text-sm leading-relaxed p-4.5 rounded-xl border transition-all duration-300"
            style={activeStyleConfig.style}
          >
            {description}
          </div>
        </div>
      )}
    </div>
  );
};
