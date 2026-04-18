import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/jeevan_logo.jpeg";

type View = "login" | "register" | "forgot";

const AuthPage = () => {
  const [view, setView] = useState<View>("login");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let loginEmail = email.trim();
      const digits = loginEmail.replace(/\D/g, "");
      if (/^\d{10}$/.test(digits)) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("phone", digits)
          .single();
        if (profileError || !profileData?.email) {
          throw new Error("No account found with this phone number");
        }
        loginEmail = profileData.email;
      }
      const { error } = await signIn(loginEmail, password);
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/games");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      return toast.error("Enter a valid 10-digit phone number");
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            phone: phone.replace(/\D/g, ""),
          },
        },
      });
      if (error) throw error;
      if (data.user) {
        await supabase
          .from("profiles")
          .update({
            display_name: name,
            phone: phone.replace(/\D/g, ""),
            email: email,
          })
          .eq("user_id", data.user.id);
      }
      toast.success("Account created! Welcome to JEEVAN!");
      navigate("/games");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: { identifier: forgotIdentifier.trim(), newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Password changed successfully! Please sign in.");
      setView("login");
      setForgotIdentifier("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const title =
    view === "login" ? "Welcome Back" : view === "register" ? "Create Account" : "Reset Password";
  const subtitle =
    view === "login"
      ? "Sign in to continue playing"
      : view === "register"
      ? "Join the gaming platform"
      : "Enter your email or phone and set a new password";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 bg-grid">
      <Card className="w-full max-w-md gradient-card border-primary/20">
        <CardHeader className="text-center relative">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <img src={logo} alt="JEEVAN Logo" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-display text-xl font-bold text-primary">JEEVAN</span>
          </Link>
          <CardTitle className="font-display text-2xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent>
          {/* Login */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email or Phone Number</Label>
                <Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email or 10-digit phone number" required className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary border-border mt-1" />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => setView("forgot")} className="text-xs text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-display">
                {loading ? "Please wait..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => setView("register")} className="text-primary hover:underline">Sign Up</button>
              </p>
            </form>
          )}

          {/* Register */}
          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Phone Number</Label>
                <div className="flex gap-2 mt-1">
                  <div className="flex items-center px-3 bg-secondary border border-border rounded-md text-sm text-muted-foreground">+91</div>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" required maxLength={10} className="bg-secondary border-border" />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary border-border mt-1" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-display">
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => setView("login")} className="text-primary hover:underline">Sign In</button>
              </p>
            </form>
          )}

          {/* Forgot Password - Direct Reset */}
          {view === "forgot" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Email or Phone Number</Label>
                <Input type="text" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} placeholder="Email or 10-digit phone number" required className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Confirm New Password</Label>
                <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-secondary border-border mt-1" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground font-display">
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <button type="button" onClick={() => setView("login")} className="text-primary hover:underline">Sign In</button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
