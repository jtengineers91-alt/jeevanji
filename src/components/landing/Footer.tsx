import { Link } from "react-router-dom";
import logo from "@/assets/jeevan_logo.jpeg";
import { MessageCircle } from "lucide-react";

const Footer = () => {
  const openChat = () => {
    const tawkApi = (window as any).Tawk_API;
    if (tawkApi?.showWidget && tawkApi?.maximize) {
      tawkApi.showWidget();
      tawkApi.maximize();
    } else {
      window.location.reload();
    }
  };

  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="JEEVAN" className="h-7 w-7 rounded object-cover" />
              <span className="font-display text-lg font-bold text-primary">JEEVAN</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              India's premier skill-based gaming and sports prediction platform. Play responsibly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider mb-3">Games</h4>
            <div className="space-y-2">
              {["Color Trading", "Ball Pool", "Rummy", "Cricket Predictions"].map((g) => (
                <Link key={g} to="/games" className="block text-xs text-muted-foreground hover:text-primary transition-colors">{g}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider mb-3">Platform</h4>
            <div className="space-y-2">
              {[
                { label: "Wallet", to: "/wallet" },
                { label: "Profile", to: "/profile" },
                { label: "Games", to: "/games" },
              ].map((l) => (
                <Link key={l.label} to={l.to} className="block text-xs text-muted-foreground hover:text-primary transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-xs font-bold text-foreground uppercase tracking-wider mb-3">Legal</h4>
            <div className="space-y-2">
              <Link to="/terms" className="block text-xs text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</Link>
              <Link to="/privacy" className="block text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
              <a href="#" className="block text-xs text-muted-foreground hover:text-primary transition-colors">Responsible Gaming</a>
              <button onClick={openChat} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold">
                <MessageCircle className="h-3.5 w-3.5" />
                Need Help?
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            © 2026 JEEVAN. All rights reserved.
          </p>
          <p className="text-[11px] text-muted-foreground">
            18+ | Skill-based gaming only | Play responsibly
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
