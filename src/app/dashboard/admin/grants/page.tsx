"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import {
  Loader2,
  DollarSign,
  FileText,
  CheckCircle,
  TrendingUp,
  Globe,
  Lock,
  CircleDollarSign,
  ShieldAlert,
  Receipt,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { GrantTable } from "@/components/grant/GrantTable";
import { FinancialsCard } from "@/components/charts/grant-in-charts/FinancialsCard";
import { StatusRadarChart } from "@/components/charts/grant-in-charts/Pie";

import { GrantIn, GrantInFilters, GrantStatsResponse } from "@/types/grant-in";
import {
  fetchGrantIns,
  getGrantStats,
  deleteGrantIn,
  bulkDeleteGrantIns,
  fetchBills,
  updateBillStatus,
} from "@/lib/research/grant-in";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const BILL_TYPE_LABELS: Record<string, string> = {
  REGISTRATION: "Registration",
  TRAVEL: "Travel",
  ACCOMMODATION: "Accommodation",
  HARDWARE: "Hardware",
  SUBSCRIPTION: "Subscription",
  OTHER: "Other",
};

export default function AdminGrantsPage() {
  const { data: session, status } = useSession();
  const [grants, setGrants] = React.useState<GrantIn[]>([]);
  const [stats, setStats] = React.useState<GrantStatsResponse | null>(null);
  const [pendingBills, setPendingBills] = React.useState<any[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [billsLoading, setBillsLoading] = React.useState(true);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [verifyingAction, setVerifyingAction] = React.useState<"ACCEPT" | "REJECT" | null>(null);
  const [filters, setFilters] = React.useState<GrantInFilters>({});

  const loadGrants = React.useCallback(
    async (activeFilters?: GrantInFilters) => {
      try {
        setLoading(true);
        const response = await fetchGrantIns(activeFilters);
        if (response.data?.grants) setGrants(response.data.grants);
        else if (response.error) toast.error(response.error);
      } catch {
        toast.error("Failed to load grants");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadStats = React.useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await getGrantStats();
      if (response.data) setStats(response.data);
    } catch {
      /* silent */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadPendingBills = React.useCallback(async () => {
    try {
      setBillsLoading(true);
      const response = await fetchBills("PENDING");
      if (response.data?.bills) {
        setPendingBills(response.data.bills);
      }
    } catch {
      toast.error("Failed to load pending bills");
    } finally {
      setBillsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      loadGrants();
      loadStats();
      loadPendingBills();
    }
  }, [status, session, loadGrants, loadStats, loadPendingBills]);

  const handleFiltersChange = (newFilters: Partial<GrantInFilters>) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    loadGrants(merged);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadGrants({});
  };

  const handleDelete = async (grant: GrantIn) => {
    if (!confirm("Delete this grant? This cannot be undone.")) return;
    try {
      const result = await deleteGrantIn(grant.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Grant deleted successfully");
        loadGrants(filters);
        loadStats();
      }
    } catch {
      toast.error("An error occurred while deleting");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const result = await bulkDeleteGrantIns(ids);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`${ids.length} grants deleted successfully`);
        loadGrants(filters);
        loadStats();
      }
    } catch {
      toast.error("Failed to delete selected grants");
    }
  };

  const handleVerifyBill = async (grantId: string, billId: string, action: "ACCEPT" | "REJECT") => {
    const confirmMsg = action === "ACCEPT" 
      ? "Accept this bill? This will increment the grant's used amount and include the bill in the master PDF." 
      : "Reject and delete this bill? This action is permanent.";
      
    if (!confirm(confirmMsg)) return;

    setVerifyingId(billId);
    setVerifyingAction(action);

    try {
      const response = await updateBillStatus(grantId, billId, action);
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(action === "ACCEPT" ? "Bill approved successfully!" : "Bill rejected and removed.");
        loadPendingBills();
        loadGrants(filters);
        loadStats();
      }
    } catch {
      toast.error("An error occurred during verification");
    } finally {
      setVerifyingId(null);
      setVerifyingAction(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-[1600px]">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-destructive">Access Denied</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This area is restricted to system administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const grantedCount =
    stats?.grantStatusCounts.find((s) => s.status === "GRANTED")?.count ?? 0;
  const utilisation =
    stats && stats.financials.totalAmountGranted > 0
      ? Math.round(
          (stats.financials.totalUsedAmount /
            stats.financials.totalAmountGranted) *
            100,
        )
      : 0;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-[1600px] animate-in fade-in duration-500">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-primary/5 to-transparent p-6 md:p-8 backdrop-blur-md shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-purple-600 bg-clip-text flex items-center gap-2">
              <CircleDollarSign className="h-8 w-8 text-purple-500/80" />
              Grant Administration
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
              Audit, review, verify bills, export reports, and manage all institutional grants.
            </p>
          </div>
        </div>
      </div>

      {/* ── Integrated Dual-Column Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Charts, Stats, and Registry Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Stats row */}
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Total Applied",
                  value: stats.total,
                  sub: "applications",
                  icon: <FileText className="h-4 w-4" />,
                  gradient: "from-slate-400 to-slate-200",
                },
                {
                  label: "Granted",
                  value: grantedCount,
                  sub: "approved",
                  icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
                  gradient: "from-emerald-500 to-emerald-300",
                },
                {
                  label: "Public Projects",
                  value: stats.publicCount,
                  sub: "visible to all",
                  icon: <Globe className="h-4 w-4 text-sky-500" />,
                  gradient: "from-sky-500 to-sky-300",
                },
                {
                  label: "Private Projects",
                  value: stats.privateCount,
                  sub: "restricted",
                  icon: <Lock className="h-4 w-4 text-slate-400" />,
                  gradient: "from-amber-500 to-amber-300",
                },
                {
                  label: "Granted Amount",
                  value: fmt(stats.financials.totalAmountGranted),
                  sub: "total funds",
                  icon: <DollarSign className="h-4 w-4 text-blue-500" />,
                  gradient: "from-blue-500 to-blue-300",
                  small: true,
                },
                {
                  label: "Amount Used",
                  value: fmt(stats.financials.totalUsedAmount),
                  sub: `${utilisation}% utilised`,
                  icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
                  gradient: "from-orange-500 to-orange-300",
                  small: true,
                },
              ].map(({ label, value, sub, icon, gradient, small }) => (
                <Card key={label} className="col-span-1 border border-border/40 hover:-translate-y-1 hover:shadow-xs transition-all duration-300 bg-card/60 backdrop-blur-sm relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gradient}`} />
                  <CardHeader className="pb-1 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors">
                      {icon} {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className={`font-bold leading-tight ${small ? "text-sm" : "text-xl"} tracking-tight text-foreground`}>
                      {value}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {/* Charts */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FinancialsCard financials={stats.financials} />
              <StatusRadarChart
                statusCounts={Object.fromEntries(
                  stats.grantStatusCounts.map((s) => [s.status, s.count])
                )}
                total={stats.total}
              />
            </div>
          )}

          {/* Grant Registry Table */}
          <div className="rounded-2xl border border-border/45 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden p-1">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <GrantTable
                grants={grants}
                userRole={UserRole.ADMIN}
                currentUserId={session.user.id}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onRefresh={() => {
                  loadGrants(filters);
                  loadStats();
                }}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Pending Claims Verification Queue (Side panel layout) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="p-5 pb-2 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-purple-600 animate-pulse" /> Claims Verification Queue
                </span>
                {pendingBills.length > 0 && (
                  <Badge variant="destructive" className="h-5 px-2 text-[10px] font-bold">
                    {pendingBills.length} Pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Review, download receipts, and verify pending expense requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 max-h-[750px] overflow-y-auto scrollbar-gradient">
              {billsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingBills.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2 bg-muted/5">
                  <CheckCircle className="h-6 w-6 opacity-35 text-emerald-500" />
                  <p className="font-semibold text-foreground">Queue is Clear</p>
                  <p className="text-[10px]">No pending bill approvals required.</p>
                </div>
              ) : (
                pendingBills.map((bill) => (
                  <div key={bill.id} className="p-4 rounded-xl border border-border/25 bg-card/45 hover:bg-muted/5 transition-colors space-y-3">
                    {/* Top Row: Code and Amount */}
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {bill.grantIn?.projectCode || "Grant Project"}
                      </span>
                      <span className="font-bold text-sm text-emerald-600 tabular-nums">
                        {bill.amount != null ? fmt(bill.amount) : "—"}
                      </span>
                    </div>

                    {/* Researcher Avatar and Name */}
                    <div className="flex items-center gap-2 border-y border-border/10 py-2">
                      <Avatar className="h-6 w-6 border">
                        <AvatarImage src={bill.user?.image || undefined} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                          {bill.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left overflow-hidden leading-tight">
                        <span className="text-xs font-semibold truncate text-foreground">{bill.user?.name || "Unknown"}</span>
                        <span className="text-[9px] text-muted-foreground truncate max-w-[170px]">
                          {bill.user?.email}
                        </span>
                      </div>
                    </div>

                    {/* Metadata: Date, Type, Actions */}
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                        <Badge variant="outline" className="text-[9px] capitalize py-0 font-semibold">
                          {bill.billType === "OTHER" && bill.customBillType
                            ? bill.customBillType
                            : BILL_TYPE_LABELS[bill.billType] || bill.billType}
                        </Badge>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(bill.billDate), "dd MMM yyyy")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {bill.fileUrl && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 border border-border bg-background" asChild>
                            <a href={bill.fileUrl} target="_blank" rel="noopener noreferrer" title="View Receipt">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/20 hover:text-emerald-600"
                          onClick={() => handleVerifyBill(bill.grantInId, bill.id, "ACCEPT")}
                          disabled={verifyingId === bill.id}
                        >
                          {verifyingId === bill.id && verifyingAction === "ACCEPT" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 border border-destructive/20 bg-destructive/5 hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => handleVerifyBill(bill.grantInId, bill.id, "REJECT")}
                          disabled={verifyingId === bill.id}
                        >
                          {verifyingId === bill.id && verifyingAction === "REJECT" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
