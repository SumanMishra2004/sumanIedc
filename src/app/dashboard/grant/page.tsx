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
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { GrantTable } from "@/components/grant/GrantTable";
import { GrantAddDialog } from "@/components/grant/GrantAddDialog";
import { StatusRadarChart } from "@/components/charts/grant-in-charts/Pie";
import { FinancialsCard } from "@/components/charts/grant-in-charts/FinancialsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { GrantIn, GrantInFilters, GrantStatsResponse } from "@/types/grant-in";
import {
  fetchGrantIns,
  getGrantStats,
  deleteGrantIn,
  bulkDeleteGrantIns,
} from "@/lib/research/grant-in";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function GrantPage() {
  const { data: session, status } = useSession();
  const [grants, setGrants] = React.useState<GrantIn[]>([]);
  const [stats, setStats] = React.useState<GrantStatsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<GrantInFilters>({});

  const loadGrants = React.useCallback(
    async (activeFilters?: GrantInFilters) => {
      if (!session?.user) return;
      try {
        setLoading(true);
        const response = await fetchGrantIns(activeFilters);
        console.log("Fetched grants:", response);
        if (response.data?.grants) setGrants(response.data.grants);
        else if (response.error) toast.error(response.error);
      } catch {
        toast.error("Failed to load grants");
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  const handleFiltersChange = (newFilters: Partial<GrantInFilters>) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    loadGrants(merged);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadGrants({});
  };

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

  React.useEffect(() => {
    if (status === "authenticated") {
      loadGrants();
      loadStats();
    }
  }, [status, loadGrants, loadStats]);

  const handleDelete = async (grant: GrantIn) => {
    if (!confirm("Delete this grant? This cannot be undone.")) return;
    try {
      const result = await deleteGrantIn(grant.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Grant deleted");
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
        toast.success(`${ids.length} grant${ids.length !== 1 ? "s" : ""} deleted`);
        loadGrants(filters);
        loadStats();
      }
    } catch {
      toast.error("Failed to delete selected grants");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>Please sign in to view this page.</p>
      </div>
    );
  }

  const userRole = session.user.role as UserRole;
  const canCreate = userRole === "ADMIN" || userRole === "FACULTY";

  const myGrants = grants.filter(
    (g) =>
      g.facultyAuthors.some((a) => a.userId === session.user.id) ||
      g.studentAuthors.some((a) => a.userId === session.user.id),
  );
  const myPiGrants = grants.filter((g) =>
    g.facultyAuthors.some(
      (a) =>
        a.userId === session.user.id &&
        (a.role === "FACULTY_PI" || a.role === "FACULTY_COPI"),
    ),
  );

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
    <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Grants</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {userRole === "ADMIN"
              ? "Overview of all research grants across the institution."
              : userRole === "FACULTY"
                ? "Grants you are a member of as PI, Co-PI, or faculty."
                : "Grants you are enrolled in as a student researcher."}
          </p>
        </div>
        {canCreate && <GrantAddDialog userRole={userRole} />}
      </div>

      {/* ── Context bar ── */}
      {userRole !== "ADMIN" && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="capitalize">
            {userRole.toLowerCase()}
          </Badge>
          <Separator orientation="vertical" className="h-4" />
          <span>
            {myGrants.length} grant{myGrants.length !== 1 ? "s" : ""} as member
          </span>
          {userRole === "FACULTY" && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span>{myPiGrants.length} as PI / Co-PI</span>
            </>
          )}
        </div>
      )}

      {/* ── Stats row ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Total Applied",
              value: stats.total,
              sub: "applications",
              icon: <FileText className="h-3.5 w-3.5" />,
              color: "",
            },
            {
              label: "Granted",
              value: grantedCount,
              sub: "approved",
              icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
              color: "text-emerald-600",
            },
            {
              label: "Public",
              value: stats.publicCount,
              sub: "visible to all",
              icon: <Globe className="h-3.5 w-3.5 text-sky-500" />,
              color: "",
            },
            {
              label: "Private",
              value: stats.privateCount,
              sub: "restricted",
              icon: <Lock className="h-3.5 w-3.5 text-slate-400" />,
              color: "",
            },
            {
              label: "Granted Amount",
              value: fmt(stats.financials.totalAmountGranted),
              sub: "total funds",
              icon: <DollarSign className="h-3.5 w-3.5 text-blue-500" />,
              color: "text-blue-600",
              small: true,
            },
            {
              label: "Amount Used",
              value: fmt(stats.financials.totalUsedAmount),
              sub: `${utilisation}% utilised`,
              icon: <TrendingUp className="h-3.5 w-3.5 text-orange-500" />,
              color: "text-orange-600",
              small: true,
            },
          ].map(({ label, value, sub, icon, color, small }) => (
            <Card key={label} className="col-span-1">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  {icon} {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p
                  className={`font-bold leading-tight ${small ? "text-lg" : "text-2xl"} ${color}`}
                >
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* ── Charts ── */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FinancialsCard financials={stats.financials} />
          <StatusRadarChart
            statusCounts={Object.fromEntries(
              stats.grantStatusCounts.map((s) => [s.status, s.count]),
            )}
            total={stats.total}
          />
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-lg border bg-card shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <GrantTable
            grants={grants}
            userRole={userRole}
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
  );
}
