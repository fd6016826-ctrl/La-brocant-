// Helper for custom listing description custom styling
export interface DescriptionStyleInfo {
  className: string;
  label: string;
  fontFamily: string;
  style?: React.CSSProperties;
}

export const getDescriptionStyleConfig = (styleType: string | undefined, isDarkMode: boolean): DescriptionStyleInfo => {
  const t = styleType || "normal";
  switch (t.toLowerCase()) {
    case "vintage-serif":
      return {
        className: `font-serif tracking-normal leading-relaxed text-sm italic p-5 rounded-2xl border-2 border-amber-800/20 `,
        label: "📜 Cabinet d'Écrivain",
        fontFamily: "Georgia, Cambria, serif",
        style: {
          backgroundColor: isDarkMode ? "#221910" : "#fffcf7",
          color: isDarkMode ? "#ebdac5" : "#4a3525",
          borderColor: isDarkMode ? "#54381d" : "#e0caa0",
          fontStyle: "italic",
          boxShadow: isDarkMode ? "inset 0 0 10px rgba(0,0,0,0.5)" : "0 4px 10px rgba(180,120,60,0.05)"
        }
      };
    case "modern-mono":
      return {
        className: `font-mono text-xs tracking-tight leading-loose p-5 rounded-2xl border-2 border-dashed`,
        label: "⚙️ Brut Monospace",
        fontFamily: "monospace, Courier",
        style: {
          backgroundColor: isDarkMode ? "#121415" : "#1e293b",
          color: isDarkMode ? "#f59e0b" : "#10b981",
          borderColor: isDarkMode ? "#374151" : "#475569",
          fontWeight: "bold",
          fontFamily: "'Courier New', Courier, monospace"
        }
      };
    case "handwritten":
      return {
        className: `font-sans leading-relaxed text-base p-5 rounded-2xl border border-dashed relative overflow-hidden`,
        label: "✍️ Esprit Manuscrit",
        fontFamily: "cursive, Brush Script MT",
        style: {
          backgroundColor: isDarkMode ? "#1d1f14" : "#fefdfa",
          color: isDarkMode ? "#ffd993" : "#4d3a12",
          borderColor: isDarkMode ? "#a15e02" : "#b45309",
          fontStyle: "italic",
          fontFamily: "'Georgia', cursive",
          textDecoration: "underline",
          textDecorationColor: isDarkMode ? "#3f3a22" : "#fbe090"
        }
      };
    case "neon-glow":
      return {
        className: `font-serif text-sm px-6 py-5.5 rounded-2xl border-4 border-double`,
        label: "📰 Gazette Rétro",
        fontFamily: "Georgia, serif",
        style: {
          backgroundColor: isDarkMode ? "#000000" : "#2c2c2c",
          color: isDarkMode ? "#fcd34d" : "#ffffff",
          borderColor: isDarkMode ? "#e5e7eb" : "#fbbf24",
          fontStyle: "italic",
          fontWeight: "bold",
          boxShadow: isDarkMode ? "0 0 12px rgba(245,158,11,0.25)" : "3px 3px 12px rgba(0,0,0,0.2)"
        }
      };
    default:
      return {
        className: `text-sm leading-relaxed p-4 rounded-xl border`,
        label: "Standard de gré à gré",
        fontFamily: "sans-serif",
        style: {
          backgroundColor: isDarkMode ? "rgba(12,10,9,0.4)" : "#fafafa",
          borderColor: isDarkMode ? "#292524" : "#f5f5f4",
          color: isDarkMode ? "#d6d3d1" : "#57534e"
        }
      };
  }
};
