import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, ArrowDownLeft, Gift, Plus, CreditCard, History, Upload, CheckCircle, Download } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import qr50 from "@/assets/qr-50.png";
import qr100 from "@/assets/qr-100.png";
import qr200 from "@/assets/qr-200.png";
import qr500 from "@/assets/qr-500.png";
import qr1000 from "@/assets/qr-1000.png";

const DEPOSIT_AMOUNTS = [50, 100, 200, 500, 1000];

const QR_IMAGES: Record<number, string> = {
  50: qr50,
  100: qr100,
  200: qr200,
  500: qr500,
  1000: qr1000,
};

const WalletPage = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState<"qr" | "upi" | null>(null);
  const [depositUpiId, setDepositUpiId] = useState("");
  const [customDepositAmount, setCustomDepositAmount] = useState("");
  const [upiSubmitted, setUpiSubmitted] = useState(false);
  const [upiTxnId, setUpiTxnId] = useState<string | null>(null);
  const [withdrawMethod, setWithdrawMethod] = useState<"upi" | "bank" | null>(null);
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState("");
  const [withdrawIfsc, setWithdrawIfsc] = useState("");
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState("");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setTransactions(data || []);
  };

  const handleDepositSubmit = async () => {
    if (!selectedAmount || !screenshotFile || !user) return;
    setUploading(true);
    try {
      const fileExt = screenshotFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, screenshotFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(filePath);

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: selectedAmount,
        status: "pending",
        payment_method: "QR Scan",
        description: `Deposit ₹${selectedAmount} via QR`,
        payment_screenshot_url: urlData.publicUrl,
      });

      toast.success("Payment proof submitted! Awaiting admin approval.");
      resetDepositForm();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetDepositForm = () => {
    setSelectedAmount(null);
    setScreenshotFile(null);
    setDepositMethod(null);
    setDepositUpiId("");
    setCustomDepositAmount("");
    setDepositDialogOpen(false);
    setUpiSubmitted(false);
    setUpiTxnId(null);
  };

  const handleUpiDepositSubmit = async () => {
    if (!selectedAmount) return toast.error("Select an amount");
    if (!depositUpiId.trim()) return toast.error("Enter your UPI ID");
    if (!user) return;
    setUploading(true);
    try {
      // Try UPI collect request
      let orderId: string | null = null;
      let paymentLinkUrl: string | null = null;
      try {
        const { data, error } = await supabase.functions.invoke("upi-collect", {
          body: { amount: selectedAmount, upi_id: depositUpiId.trim(), user_id: user.id },
        });
        if (!error && !data?.error) {
          orderId = data?.order_id || null;
          paymentLinkUrl = data?.payment_link_url || null;
        }
      } catch {
        // UPI collect may fail in test mode
      }

      // Save transaction record with UPI ID (no screenshot yet)
      const { data: txData } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: selectedAmount,
        status: "pending",
        payment_method: "UPI Request",
        description: `Deposit ₹${selectedAmount} via UPI to ${depositUpiId.trim()}`,
        upi_id: depositUpiId.trim(),
        razorpay_order_id: orderId,
      }).select("id").single();

      if (paymentLinkUrl) {
        window.open(paymentLinkUrl, "_blank");
      }

      toast.success("UPI request submitted! Now upload payment screenshot.");
      setUpiSubmitted(true);
      setUpiTxnId(txData?.id || null);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit UPI deposit");
    } finally {
      setUploading(false);
    }
  };

  const handleUpiScreenshotUpload = async () => {
    if (!screenshotFile || !user || !upiTxnId) return;
    setUploading(true);
    try {
      const fileExt = screenshotFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, screenshotFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(filePath);

      await supabase.from("transactions")
        .update({ payment_screenshot_url: urlData.publicUrl })
        .eq("id", upiTxnId);

      toast.success("Screenshot uploaded! Awaiting admin approval.");
      resetDepositForm();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 100) return toast.error("Minimum withdrawal ₹100");
    if (amount > (wallet?.balance || 0)) return toast.error("Insufficient balance");
    if (!user) return;
    if (!withdrawMethod) return toast.error("Select a withdrawal method");
    if (withdrawMethod === "upi" && !withdrawUpi.trim()) return toast.error("Enter your UPI ID");
    if (withdrawMethod === "bank" && (!withdrawAccountNumber.trim() || !withdrawIfsc.trim() || !withdrawBankName.trim() || !withdrawAccountHolder.trim()))
      return toast.error("Fill all bank details");

    setWithdrawing(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - amount }).eq("user_id", user.id);
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdrawal",
        amount: -amount,
        status: "processing",
        payment_method: withdrawMethod === "upi" ? "UPI" : "Bank Transfer",
        description: `Withdrawal via ${withdrawMethod === "upi" ? "UPI" : "Bank Transfer"}`,
        withdrawal_method: withdrawMethod,
        upi_id: withdrawMethod === "upi" ? withdrawUpi.trim() : null,
        bank_account_number: withdrawMethod === "bank" ? withdrawAccountNumber.trim() : null,
        bank_ifsc: withdrawMethod === "bank" ? withdrawIfsc.trim() : null,
        bank_name: withdrawMethod === "bank" ? withdrawBankName.trim() : null,
        account_holder_name: withdrawMethod === "bank" ? withdrawAccountHolder.trim() : null,
      } as any);
      toast.success("Withdrawal request submitted! Processing in 24-48 hours.");
      refreshWallet();
      fetchTransactions();
      resetWithdrawForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount("");
    setWithdrawMethod(null);
    setWithdrawUpi("");
    setWithdrawBankName("");
    setWithdrawAccountNumber("");
    setWithdrawIfsc("");
    setWithdrawAccountHolder("");
    setWithdrawDialogOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit": return ArrowDownLeft;
      case "withdrawal": return ArrowUpRight;
      case "game_win": case "bonus": case "referral_bonus": return Gift;
      default: return History;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8">
          My <span className="text-primary text-glow">Wallet</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="gradient-card border-primary/30 box-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-body">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-display font-bold text-primary text-glow">₹{wallet?.balance || 0}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="gradient-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-body">Total Winnings</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-display font-bold text-neon-green">₹{wallet?.total_winnings || 0}</span>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="gradient-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-body">Bonus Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-display font-bold text-neon-purple">₹{wallet?.bonus_balance || 0}</span>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="flex gap-4 mb-10">
          <Dialog open={depositDialogOpen} onOpenChange={(o) => { setDepositDialogOpen(o); if (!o) resetDepositForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground font-display">
                <Plus className="h-4 w-4 mr-2" /> Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="gradient-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Deposit Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {!depositMethod ? (
                  <>
                    <p className="text-sm text-muted-foreground">Choose deposit method:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="border-border text-foreground hover:text-primary hover:border-primary/50 h-20 flex-col gap-1" onClick={() => setDepositMethod("qr")}>
                        <span className="text-2xl">📱</span>
                        <span className="text-sm font-display">Scan QR</span>
                        <span className="text-[10px] text-muted-foreground">Pay & upload screenshot</span>
                      </Button>
                      <Button variant="outline" className="border-border text-foreground hover:text-primary hover:border-primary/50 h-20 flex-col gap-1" onClick={() => setDepositMethod("upi")}>
                        <span className="text-2xl">💸</span>
                        <span className="text-sm font-display">UPI Request</span>
                        <span className="text-[10px] text-muted-foreground">We'll send collect request</span>
                      </Button>
                    </div>
                  </>
                ) : depositMethod === "qr" ? (
                  <>
                    {!selectedAmount ? (
                      <>
                        <p className="text-sm text-muted-foreground">Select amount to deposit:</p>
                        <div className="grid grid-cols-3 gap-3">
                          {DEPOSIT_AMOUNTS.map(a => (
                            <Button key={a} variant="outline" className="border-border text-foreground hover:text-primary hover:border-primary/50 font-display text-lg h-14" onClick={() => setSelectedAmount(a)}>
                              ₹{a}
                            </Button>
                          ))}
                        </div>
                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setDepositMethod(null)}>← Change Method</Button>
                      </>
                    ) : !screenshotFile ? (
                      <>
                        <div className="text-center space-y-3">
                          <p className="text-sm text-muted-foreground">Scan QR to pay <span className="text-primary font-bold">₹{selectedAmount}</span></p>
                          <div className="mx-auto w-48 h-48 bg-white rounded-lg p-2">
                            <img src={QR_IMAGES[selectedAmount]} alt={`Pay ₹${selectedAmount}`} className="w-full h-full object-contain" />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/40 text-primary hover:bg-primary/10"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                const response = await fetch(QR_IMAGES[selectedAmount!]);
                                const blob = await response.blob();
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = `jeevan-qr-${selectedAmount}.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                              } catch {
                                toast.error("Failed to download QR");
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download QR
                          </Button>
                          <p className="text-xs text-muted-foreground">After successful payment, upload screenshot below</p>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer justify-center px-4 py-3 border border-dashed border-primary/50 rounded-lg hover:bg-primary/5 transition-colors">
                            <Upload className="h-5 w-5 text-primary" />
                            <span className="text-sm text-primary font-medium">Upload Payment Screenshot</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setSelectedAmount(null)}>← Change Amount</Button>
                      </>
                    ) : (
                      <>
                        <div className="text-center space-y-3">
                          <CheckCircle className="h-10 w-10 text-primary mx-auto" />
                          <p className="text-sm text-foreground">Amount: <span className="text-primary font-bold">₹{selectedAmount}</span></p>
                          <p className="text-xs text-muted-foreground">Screenshot: {screenshotFile.name}</p>
                        </div>
                        <Button onClick={handleDepositSubmit} disabled={uploading} className="w-full gradient-primary text-primary-foreground font-display">
                          {uploading ? "Submitting..." : "Submit Payment Proof"}
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setScreenshotFile(null)}>← Change Screenshot</Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {!selectedAmount ? (
                      <>
                        <p className="text-sm text-muted-foreground">Select amount to deposit:</p>
                        <div className="grid grid-cols-3 gap-3">
                          {DEPOSIT_AMOUNTS.map(a => (
                            <Button key={a} variant="outline" className="border-border text-foreground hover:text-primary hover:border-primary/50 font-display text-lg h-14" onClick={() => setSelectedAmount(a)}>
                              ₹{a}
                            </Button>
                          ))}
                        </div>
                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setDepositMethod(null)}>← Change Method</Button>
                      </>
                    ) : !upiSubmitted ? (
                      <>
                        <p className="text-sm text-muted-foreground text-center">Amount: <span className="text-primary font-bold text-lg">₹{selectedAmount}</span></p>
                        <Input
                          placeholder="Your UPI ID (e.g. name@upi)"
                          value={depositUpiId}
                          onChange={e => setDepositUpiId(e.target.value)}
                          className="bg-secondary border-border"
                        />
                        <Button onClick={handleUpiDepositSubmit} disabled={uploading || !depositUpiId.trim()} className="w-full gradient-primary text-primary-foreground font-display">
                          {uploading ? "Submitting..." : "Send UPI Request"}
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { setSelectedAmount(null); }}>← Change Amount</Button>
                      </>
                    ) : (
                      <>
                        <div className="text-center space-y-2">
                          <CheckCircle className="h-10 w-10 text-primary mx-auto" />
                          <p className="text-sm text-foreground font-semibold">UPI Request Sent!</p>
                          <p className="text-xs text-muted-foreground">Amount: <span className="text-primary font-bold">₹{selectedAmount}</span> • UPI: <span className="text-primary">{depositUpiId}</span></p>
                          <p className="text-xs text-muted-foreground">Now upload your payment screenshot for faster verification</p>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer justify-center px-4 py-3 border border-dashed border-primary/50 rounded-lg hover:bg-primary/5 transition-colors">
                          <Upload className="h-5 w-5 text-primary" />
                          <span className="text-sm text-primary font-medium">
                            {screenshotFile ? screenshotFile.name : "Upload Payment Screenshot"}
                          </span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} />
                        </label>
                        {screenshotFile && (
                          <p className="text-xs text-primary text-center flex items-center justify-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Screenshot attached
                          </p>
                        )}

                        {screenshotFile ? (
                          <Button onClick={handleUpiScreenshotUpload} disabled={uploading} className="w-full gradient-primary text-primary-foreground font-display">
                            {uploading ? "Uploading..." : "Submit Screenshot"}
                          </Button>
                        ) : (
                          <Button variant="ghost" className="w-full text-muted-foreground" onClick={resetDepositForm}>
                            Skip & Close
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawDialogOpen} onOpenChange={(o) => { setWithdrawDialogOpen(o); if (!o) resetWithdrawForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-display">
                <CreditCard className="h-4 w-4 mr-2" /> Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="gradient-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Withdraw Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Available: <span className="text-primary font-bold">₹{wallet?.balance || 0}</span></p>
                <Input type="number" placeholder="Amount (min ₹100)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="bg-secondary border-border" min={100} />

                {!withdrawMethod ? (
                  <>
                    <p className="text-sm text-muted-foreground">Choose withdrawal method:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="border-border text-foreground hover:text-primary hover:border-primary/50 h-16 flex-col gap-1" onClick={() => setWithdrawMethod("upi")}>
                        <span className="text-lg font-display">UPI</span>
                        <span className="text-xs text-muted-foreground">Via UPI ID</span>
                      </Button>
                      <Button variant="outline" className="border-border text-foreground hover:text-primary hover:border-primary/50 h-16 flex-col gap-1" onClick={() => setWithdrawMethod("bank")}>
                        <span className="text-lg font-display">Bank</span>
                        <span className="text-xs text-muted-foreground">Account Transfer</span>
                      </Button>
                    </div>
                  </>
                ) : withdrawMethod === "upi" ? (
                  <>
                    <Input placeholder="Enter your UPI ID (e.g. name@upi)" value={withdrawUpi} onChange={e => setWithdrawUpi(e.target.value)} className="bg-secondary border-border" />
                    <Button onClick={handleWithdraw} disabled={withdrawing} className="w-full gradient-primary text-primary-foreground font-display">
                      {withdrawing ? "Processing..." : "Request Withdrawal"}
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setWithdrawMethod(null)}>← Change Method</Button>
                  </>
                ) : (
                  <>
                    <Input placeholder="Account Holder Name" value={withdrawAccountHolder} onChange={e => setWithdrawAccountHolder(e.target.value)} className="bg-secondary border-border" />
                    <Input placeholder="Bank Name" value={withdrawBankName} onChange={e => setWithdrawBankName(e.target.value)} className="bg-secondary border-border" />
                    <Input placeholder="Account Number" value={withdrawAccountNumber} onChange={e => setWithdrawAccountNumber(e.target.value)} className="bg-secondary border-border" />
                    <Input placeholder="IFSC Code" value={withdrawIfsc} onChange={e => setWithdrawIfsc(e.target.value)} className="bg-secondary border-border" />
                    <Button onClick={handleWithdraw} disabled={withdrawing} className="w-full gradient-primary text-primary-foreground font-display">
                      {withdrawing ? "Processing..." : "Request Withdrawal"}
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setWithdrawMethod(null)}>← Change Method</Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map(tx => {
                const Icon = getIcon(tx.type);
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">{tx.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{tx.description || ""} • {new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-display font-bold ${tx.amount > 0 ? "text-primary" : "text-neon-red"}`}>
                        {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount)}
                      </p>
                      <p className={`text-xs ${tx.status === "pending" ? "text-neon-orange" : tx.status === "processing" ? "text-neon-orange" : tx.status === "failed" ? "text-neon-red" : "text-muted-foreground"}`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default WalletPage;
