import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpRight, ArrowDownLeft, Image as ImageIcon, Banknote, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminTransactions = () => {
  const [txns, setTxns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => { fetchTxns(); }, []);

  const fetchTxns = async () => {
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (!txData) { setTxns([]); return; }

    const userIds = [...new Set(txData.map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, email")
      .in("user_id", userIds);
    
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setTxns(txData.map(t => ({ ...t, profile: profileMap.get(t.user_id) || null })));
  };

  const updateStatus = async (id: string, status: string, tx: any) => {
    await supabase.from("transactions").update({ status }).eq("id", id);
    
    // If approving a deposit, credit wallet
    if (status === "completed" && tx.type === "deposit") {
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).single();
      if (wallet) {
        await supabase.from("wallets").update({
          balance: (wallet.balance || 0) + Math.abs(tx.amount),
          total_deposited: (wallet.total_deposited || 0) + Math.abs(tx.amount),
        }).eq("user_id", tx.user_id);
      }
    }

    // If approving a withdrawal, deduct from wallet
    if (status === "completed" && tx.type === "withdrawal") {
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).single();
      if (wallet) {
        await supabase.from("wallets").update({
          balance: (wallet.balance || 0) - Math.abs(tx.amount),
          total_withdrawn: (wallet.total_withdrawn || 0) + Math.abs(tx.amount),
        }).eq("user_id", tx.user_id);
      }
    }
    
    toast.success(`Transaction ${status}`);
    fetchTxns();
  };

  const filtered = txns.filter(t => {
    const profile = t.profile;
    return (profile?.username || "").toLowerCase().includes(search.toLowerCase()) ||
           (profile?.email || "").toLowerCase().includes(search.toLowerCase()) ||
           t.id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">Payment <span className="text-primary text-glow">Transactions</span></h1>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Badge variant="secondary" className="text-muted-foreground">{filtered.length} transactions</Badge>
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-muted-foreground font-medium">User</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Details</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                    <td className="p-4 text-foreground">{tx.profile?.username || tx.profile?.email || "N/A"}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 capitalize">
                        {tx.type === "deposit" ? <ArrowDownLeft className="h-3 w-3 text-primary" /> : <ArrowUpRight className="h-3 w-3 text-neon-orange" />}
                        {tx.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 font-display text-foreground">₹{Math.abs(tx.amount)}</td>
                    <td className="p-4">
                      {tx.type === "deposit" && tx.payment_method === "UPI Request" ? (
                        <div className="text-xs space-y-1">
                          <span className="flex items-center gap-1 text-primary"><Smartphone className="h-3 w-3" /> {tx.upi_id || "—"}</span>
                          <p className="text-muted-foreground">Via UPI Collect</p>
                          {tx.payment_screenshot_url && (
                            <Button size="sm" variant="ghost" className="text-primary text-xs gap-1 h-6 px-1" onClick={() => setPreviewUrl(tx.payment_screenshot_url)}>
                              <ImageIcon className="h-3 w-3" /> View Screenshot
                            </Button>
                          )}
                        </div>
                      ) : tx.type === "deposit" && tx.payment_screenshot_url ? (
                        <Button size="sm" variant="ghost" className="text-primary text-xs gap-1" onClick={() => setPreviewUrl(tx.payment_screenshot_url)}>
                          <ImageIcon className="h-3 w-3" /> Screenshot
                        </Button>
                      ) : tx.type === "withdrawal" ? (
                        <div className="text-xs space-y-0.5">
                          {(tx as any).withdrawal_method === "upi" ? (
                            <span className="flex items-center gap-1 text-primary"><Smartphone className="h-3 w-3" /> {(tx as any).upi_id || "—"}</span>
                          ) : (tx as any).withdrawal_method === "bank" ? (
                            <div className="space-y-0.5">
                              <span className="flex items-center gap-1 text-primary"><Banknote className="h-3 w-3" /> {(tx as any).bank_name || "—"}</span>
                              <p className="text-muted-foreground">A/C: {(tx as any).bank_account_number || "—"}</p>
                              <p className="text-muted-foreground">IFSC: {(tx as any).bank_ifsc || "—"}</p>
                              <p className="text-muted-foreground">Name: {(tx as any).account_holder_name || "—"}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className={`text-xs ${tx.status === "completed" ? "text-primary" : tx.status === "failed" ? "text-neon-red" : "text-neon-orange"}`}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {(tx.status === "processing" || tx.status === "pending") && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="text-primary text-xs" onClick={() => updateStatus(tx.id, "completed", tx)}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-neon-red text-xs" onClick={() => updateStatus(tx.id, "failed", tx)}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="gradient-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Payment Screenshot</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Payment proof" className="w-full rounded-lg" loading="lazy" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactions;
