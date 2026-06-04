"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Loader2,
  FileText,
  DollarSign,
  Users,
  Calendar,
  BookOpen,
  Microscope,
  ScrollText,
  Award,
  ShieldCheck,
  GraduationCap,
  Receipt,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getGrantInById } from "@/lib/research/grant-in";
import { GrantIn, GrantInBill } from "@/types/grant-in";
import { toast } from "sonner";
import { BillsSection } from "@/components/grant/bills/BillsSection";
import { BillUploadDialog } from "@/components/grant/bills/BillUploadDialog";
import { UserRole, BillType } from "@prisma/client";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const statusColor: Record<string, string> = {
  APPLIED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  UNDER_REVIEW: "bg-yellow-55 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  GRANTED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-800",
};

const publicationIcon: Record<string, React.ReactNode> = {
  JOURNAL: <BookOpen className="h-4 w-4 text-blue-500" />,
  CONFERENCE: <Microscope className="h-4 w-4 text-purple-500" />,
  PATENT: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  BOOK_CHAPTER: <ScrollText className="h-4 w-4 text-amber-500" />,
  COPYRIGHT: <Award className="h-4 w-4 text-sky-500" />,
};

const BILL_TYPE_LABELS: Record<string, string> = {
  REGISTRATION: "Registration",
  TRAVEL: "Travel",
  ACCOMMODATION: "Accommodation",
  HARDWARE: "Hardware",
  SUBSCRIPTION: "Subscription",
  OTHER: "Other Expense",
};

export default function GrantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [grant, setGrant] = React.useState<GrantIn | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const loadGrant = React.useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      setLoading(true);
      const res = await getGrantInById(id);
      if (res.data?.grant) {
        setGrant(res.data.grant);
      } else {
        toast.error(res.error ?? "Grant not found");
        router.push("/dashboard/grant");
      }
    } catch {
      toast.error("Failed to load grant");
      router.push("/dashboard/grant");
    } finally {
      setLoading(false);
    }
  }, [id, status, router]);

  React.useEffect(() => {
    loadGrant();
  }, [loadGrant]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!grant) return null;

  const currentUserId = session?.user?.id ?? "";
  const userRole = (session?.user?.role as UserRole) ?? UserRole.STUDENT;

  const isPiOrCoPi = grant.facultyAuthors.some(
    (a) =>
      a.userId === currentUserId &&
      (a.role === "FACULTY_PI" || a.role === "FACULTY_COPI")
  );
  const isMember =
    grant.facultyAuthors.some((a) => a.userId === currentUserId) ||
    grant.studentAuthors.some((a) => a.userId === currentUserId);

  const utilizationPct =
    grant.amountGranted && grant.amountGranted > 0
      ? Math.min(
          100,
          Math.round(((grant.usedAmount ?? 0) / grant.amountGranted) * 100)
        )
      : 0;

  const masterPdf = grant.bills?.find((b) => b.isMasterPdf);
  const regularBills = grant.bills?.filter((b) => !b.isMasterPdf) || [];
  const pendingBills = regularBills.filter((b) => b.billStatus === "PENDING");
  const acceptedBills = regularBills.filter((b) => b.billStatus === "ACCEPTED");

  // Workflow verification steps calculation
  const stepperSteps = [
    {
      label: "Proposal Submitted",
      description: "Grant applied for review",
      status: "completed",
    },
    {
      label: "Granted & Sanctioned",
      description:
        grant.grantInStatus === "REJECTED"
          ? "Rejected"
          : grant.grantInStatus === "GRANTED" || grant.grantInStatus === "COMPLETED"
          ? "Approved"
          : "Awaiting review",
      status:
        grant.grantInStatus === "REJECTED"
          ? "failed"
          : grant.grantInStatus === "GRANTED" || grant.grantInStatus === "COMPLETED"
          ? "completed"
          : "current",
    },
    {
      label: "Expense Claims Added",
      description:
        regularBills.length > 0 ? `${regularBills.length} claim(s) uploaded` : "No claims submitted",
      status:
        regularBills.length > 0
          ? "completed"
          : grant.grantInStatus === "GRANTED"
          ? "current"
          : "upcoming",
    },
    {
      label: "PI Verified",
      description:
        pendingBills.length > 0
          ? `${pendingBills.length} pending review`
          : acceptedBills.length > 0
          ? "All verified"
          : "Awaiting claims",
      status:
        pendingBills.length > 0
          ? "current"
          : acceptedBills.length > 0
          ? "completed"
          : "upcoming",
    },
    {
      label: "Master PDF Compiled",
      description: masterPdf ? "Report generated" : "Awaiting verified claims",
      status: masterPdf
        ? "completed"
        : acceptedBills.length > 0 && pendingBills.length === 0
        ? "current"
        : "upcoming",
    },
    {
      label: "Disbursement / Close",
      description:
        grant.grantInStatus === "COMPLETED" ? "Project completed" : "Awaiting final clearance",
      status: grant.grantInStatus === "COMPLETED" ? "completed" : "upcoming",
    },
  ];

  // Expense categories analytics calculations
  const categoryTotals: Record<string, number> = {};
  const defaultTypes = ["REGISTRATION", "TRAVEL", "ACCOMMODATION", "HARDWARE", "SUBSCRIPTION", "OTHER"];
  defaultTypes.forEach((t) => {
    categoryTotals[t] = 0;
  });

  const customTypeTotals: Record<string, number> = {};
  let totalClaimed = 0;

  regularBills.forEach((b) => {
    const amount = b.amount || 0;
    totalClaimed += amount;
    if (b.billType === "OTHER" && b.customBillType) {
      customTypeTotals[b.customBillType] = (customTypeTotals[b.customBillType] || 0) + amount;
    } else {
      categoryTotals[b.billType] = (categoryTotals[b.billType] || 0) + amount;
    }
  });

  const allCategories = [
    ...Object.entries(categoryTotals).map(([type, amount]) => ({
      label: type === "OTHER" ? "Other Expenses" : BILL_TYPE_LABELS[type] || type,
      amount,
    })),
    ...Object.entries(customTypeTotals).map(([customName, amount]) => ({
      label: customName,
      amount,
    })),
  ].filter((c) => c.amount > 0 || (c.label !== "Other Expenses" && defaultTypes.includes(c.label.toUpperCase().replace(/ /g, "_"))));

  // Client-side CSV report exporter
  const handleExportCSV = () => {
    if (!grant || !grant.bills) return;
    const claims = grant.bills.filter((b) => !b.isMasterPdf);

    const headers = ["Bill ID", "Expense Type", "Amount (INR)", "Date", "Status", "Uploaded By"];

    const rows = claims.map((b) => {
      const typeLabel =
        b.billType === "OTHER" && b.customBillType
          ? b.customBillType
          : BILL_TYPE_LABELS[b.billType] || b.billType;
      const amountVal = b.amount != null ? b.amount : 0;
      const dateVal = b.billDate ? new Date(b.billDate).toLocaleDateString("en-IN") : "";
      const statusVal = b.billStatus;
      const uploaderName = b.user?.name || "Unknown";

      return [b.id, typeLabel, amountVal, dateVal, statusVal, uploaderName];
    });

    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      [headers, ...rows]
        .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expense_Report_${grant.projectCode || "Grant"}_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully");
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col gap-6 max-w-[1600px] animate-in fade-in duration-500">
      {/* ── Back button & Header ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/grant")}
          className="shrink-0 h-9 w-9 border-border/60 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
              {grant.projectCode ?? "Grant Details"}
            </h1>
            <Badge
              className={`text-[10px] font-semibold tracking-wider px-2.5 py-0.5 border capitalize ${
                statusColor[grant.grantInStatus] ?? ""
              }`}
            >
              {grant.grantInStatus.toLowerCase().replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs font-mono mt-0.5 truncate">ID: {grant.id}</p>
        </div>
      </div>

      {/* ── Workflow Stepper (Workflow Verification Tracker) ── */}
      <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Project Verification Stepper
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 pt-4 relative">
              {stepperSteps.map((step, idx) => {
                let colorClass = "bg-muted text-muted-foreground border-muted-foreground/20";
                let icon = <Clock className="h-4 w-4" />;
                if (step.status === "completed") {
                  colorClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
                  icon = <CheckCircle2 className="h-4 w-4" />;
                } else if (step.status === "current") {
                  colorClass = "bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20";
                  icon = <Loader2 className="h-4 w-4 animate-spin" />;
                } else if (step.status === "failed") {
                  colorClass = "bg-red-500/10 text-red-500 border-red-500/30";
                  icon = <XCircle className="h-4 w-4" />;
                }

                return (
                  <div key={idx} className="flex items-start gap-3 relative group">
                    <div
                      className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-full border ${colorClass} font-semibold text-xs`}
                    >
                      {icon}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Integrated Split Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Sidebar info, budgets, actions, and team members */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Card 1: Budget Tracker */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500/60 to-teal-500/40" />
            <CardHeader className="pb-3 pt-6 px-6">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Budget &amp; Funding Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Sanctioned Budget</span>
                <span className="font-bold text-emerald-600">
                  {grant.amountGranted ? fmt(grant.amountGranted) : "—"}
                </span>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Utilised</span>
                <span className="font-bold text-orange-600">
                  {grant.usedAmount ? fmt(grant.usedAmount) : "—"}
                </span>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="font-bold text-foreground">
                  {grant.amountGranted != null
                    ? fmt(grant.amountGranted - (grant.usedAmount || 0))
                    : "—"}
                </span>
              </div>

              {grant.amountGranted != null && grant.amountGranted > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Budget Expended</span>
                    <span
                      className={
                        utilizationPct >= 90
                          ? "text-red-500 font-bold"
                          : utilizationPct >= 65
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }
                    >
                      {utilizationPct}%
                    </span>
                  </div>
                  <Progress
                    value={utilizationPct}
                    className="h-2 bg-muted border border-border/20"
                    indicatorClassName={
                      utilizationPct >= 90
                        ? "bg-red-500"
                        : utilizationPct >= 65
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Timeline info */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/60 to-purple-600/40" />
            <CardHeader className="pb-3 pt-6 px-6">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Project Duration</span>
                <span className="font-semibold text-foreground bg-muted/60 py-0.5 px-2.5 rounded-lg border border-border/40">
                  {grant.durationOfProject ?? "—"}
                </span>
              </div>
              <Separator className="bg-border/40" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Application Date</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {grant.applicationDate
                    ? new Date(grant.applicationDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
              {grant.grantDate && (
                <>
                  <Separator className="bg-border/40" />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Sanction Date</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(grant.grantDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Quick Actions */}
          {(isMember || userRole === UserRole.ADMIN) && (
            <Card className="border border-primary/25 bg-primary/5 shadow-xs overflow-hidden relative">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-xs font-bold text-primary flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                {userRole !== UserRole.STUDENT && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
                      <span>Master PDF Report</span>
                      {masterPdf ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 text-[9px] h-4 py-0 font-bold border border-emerald-500/20 animate-pulse"
                        >
                          Compiled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[9px] h-4 py-0 border-dashed">
                          No verified claims
                        </Badge>
                      )}
                    </div>
                    {masterPdf ? (
                      <Button size="sm" className="w-full text-xs font-semibold" asChild>
                        <a href={masterPdf.fileUrl || undefined} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download Master PDF
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full text-xs font-semibold" disabled>
                        Download Master PDF
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {userRole !== UserRole.STUDENT && <Separator className="my-2 bg-border/40" />}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => setUploadOpen(true)}
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Expense Bill
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold border-border hover:bg-muted text-foreground"
                    onClick={handleExportCSV}
                    disabled={regularBills.length === 0}
                  >
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Export CSV Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 4: Team members list */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Project Members
                </span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {grant.facultyAuthors.length + grant.studentAuthors.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5 max-h-[350px] overflow-y-auto scrollbar-gradient">
              {/* Faculty PIs and Authors */}
              {grant.facultyAuthors.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-border/25 bg-card/45 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="h-7 w-7 border">
                      <AvatarImage src={a.user.image || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {a.user.name?.charAt(0) || "F"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden leading-tight">
                      <p className="text-xs font-semibold text-foreground truncate">{a.user.name ?? a.user.email}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{a.user.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[9px] shrink-0 font-bold capitalize">
                    {a.role.replace("FACULTY_", "").replace(/_/g, " ").toLowerCase()}
                  </Badge>
                </div>
              ))}
              {/* Student Authors */}
              {grant.studentAuthors.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 rounded-xl border border-border/25 bg-card/45 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="h-7 w-7 border">
                      <AvatarImage src={a.user.image || undefined} />
                      <AvatarFallback className="text-[10px] bg-purple-500/10 text-purple-500 font-bold">
                        {a.user.name?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden leading-tight">
                      <p className="text-xs font-semibold text-foreground truncate">{a.user.name ?? a.user.email}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{a.user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0 font-bold">
                    Student
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive Workspaces (Breakdowns, Claims table, Outputs) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Claims Category Analytics Card */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-5 bg-muted/10 border-b">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Claims Category Analytics
                </span>
                <Badge variant="outline" className="text-[10px] bg-background font-semibold">
                  {allCategories.length} categories
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-6">
              {allCategories.length === 0 || totalClaimed === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2 bg-muted/5 border border-dashed rounded-xl">
                  <BarChart3 className="h-6 w-6 opacity-30 text-muted-foreground" />
                  <span>No claims recorded yet to display category analytics.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allCategories.map((cat, idx) => {
                    const sharePct = totalClaimed > 0 ? Math.round((cat.amount / totalClaimed) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5 p-3 rounded-xl border border-border/25 bg-muted/10">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground truncate max-w-[170px]">{cat.label}</span>
                          <span className="font-bold text-foreground tabular-nums">{fmt(cat.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={sharePct} className="h-1.5 bg-muted" indicatorClassName="bg-primary" />
                          <span className="text-[10px] text-muted-foreground font-semibold shrink-0 tabular-nums">
                            {sharePct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Expenses Claims Table */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <BillsSection
                bills={grant.bills ?? []}
                grantId={grant.id}
                userRole={userRole}
                currentUserId={currentUserId}
                isPiOrCoPi={isPiOrCoPi || userRole === UserRole.ADMIN}
                isMember={isMember || userRole === UserRole.ADMIN}
                onBillsChange={loadGrant}
              />
            </CardContent>
          </Card>

          {/* Linked Research Outputs Card */}
          <Card className="border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3 px-6 pt-5 bg-muted/10 border-b">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Linked Publications &amp; Mappings
                </span>
                <Badge variant="outline" className="text-[10px] font-bold bg-background">
                  {grant.publicationMappings?.length ?? 0}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Outputs and achievements mapped to this research project.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6">
              {!grant.publicationMappings || grant.publicationMappings.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2 bg-muted/10">
                  <BookOpen className="h-6 w-6 opacity-30 text-muted-foreground" />
                  <span>No publications linked to this grant yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto scrollbar-gradient pr-1">
                  {grant.publicationMappings.map((m) => {
                    const pub = m.journal ?? m.conference ?? m.patent ?? m.bookChapter ?? m.copyright;
                    const title = (pub as any)?.title ?? (pub as any)?.journalName ?? "Untitled Publication";
                    return (
                      <div
                        key={m.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border/25 bg-card/45 hover:bg-muted/10 transition-colors shadow-2xs"
                      >
                        <span className="mt-0.5 p-1 bg-background rounded-lg border shrink-0">
                          {publicationIcon[m.publicationType] ?? <FileText className="h-4 w-4 text-muted-foreground" />}
                        </span>
                        <div className="flex-1 min-w-0 leading-tight">
                          <p className="text-xs font-semibold text-foreground line-clamp-1">{title}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                            {m.publicationType.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload bill modal */}
      <BillUploadDialog
        grantId={grant.id}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={loadGrant}
      />
    </div>
  );
}
