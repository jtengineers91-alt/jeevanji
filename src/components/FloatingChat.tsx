import { useEffect } from "react";

// Loads Tawk.to but keeps the floating bubble hidden by default.
// Users open chat from the footer "Need Help?" link or NeedHelpButton.
const FloatingChat = () => {
  useEffect(() => {
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Hide the widget as soon as it loads
    (window as any).Tawk_API.onLoad = function () {
      try {
        (window as any).Tawk_API.hideWidget();
      } catch {}
    };

    const existing = document.querySelector('script[src*="embed.tawk.to"]');
    if (existing) return;

    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = "https://embed.tawk.to/69deed0c3f5fe21c385afc3c/1jm7crvh3";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    document.head.appendChild(s1);
  }, []);

  return null;
};

export default FloatingChat;

// Reusable "Need Help?" button that opens Tawk chat
export const NeedHelpButton = ({ position = "top-right" }: { position?: "top-right" | "bottom-center" }) => {
  const openChat = () => {
    const tawkApi = (window as any).Tawk_API;
    if (tawkApi?.showWidget && tawkApi?.maximize) {
      tawkApi.showWidget();
      tawkApi.maximize();
    } else {
      window.location.reload();
    }
  };

  const positionClasses = position === "top-right"
    ? "absolute top-4 right-4 z-20"
    : "flex justify-center w-full mt-6 mb-2";

  return (
    <div className={positionClasses}>
      <button
        onClick={openChat}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-display font-semibold transition-all border border-primary/20 hover:border-primary/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Need Help?
      </button>
    </div>
  );
};
