import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Wallet, Gamepad2, Home, Shield, Trophy } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/jeevan_logo.jpeg";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const displayName = profile?.display_name || profile?.username || "Profile";

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/games", label: "Games", icon: Gamepad2 },
    { to: "/ipl-points-table", label: "Points Table", icon: Trophy },
    ...(user ? [
      { to: "/wallet", label: "Wallet", icon: Wallet },
      { to: "/profile", label: displayName, icon: User },
    ] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="JEEVAN" className="h-8 w-8 rounded object-cover" />
          <span className="font-display text-xl font-bold tracking-wide text-primary">JEEVAN</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          ) : (
            <div className="flex gap-2">
              <Link to="/auth">
                <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-display tracking-wide">
                  Log In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="gradient-primary text-primary-foreground font-display tracking-wide">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card p-3 space-y-1 animate-slide-in">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded"
              onClick={() => setOpen(false)}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border/50 flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button size="sm" variant="ghost" onClick={() => { handleSignOut(); setOpen(false); }} className="text-destructive">
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            ) : (
              <Link to="/auth" className="flex-1" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full gradient-primary text-primary-foreground font-display">Sign Up</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
