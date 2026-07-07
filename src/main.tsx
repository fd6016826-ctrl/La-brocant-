import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Interface and silence benign Vite dev-server WebSocket/HMR errors
if (typeof window !== "undefined") {
  const isBenignError = (msg: string | undefined): boolean => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes("websocket") ||
      lower.includes("vite") ||
      lower.includes("hmr") ||
      lower.includes("hot-update") ||
      lower.includes("closed without opened")
    );
  };

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    const errorMsg = event.error?.message || "";
    if (isBenignError(msg) || isBenignError(errorMsg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = typeof reason === "string" ? reason : reason?.message || "";
    if (isBenignError(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
