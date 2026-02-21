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
import { getGrantInById } from "@/lib/research/grant-in";
import { GrantIn } from "@/types/grant-in";
import { toast } from "sonner";
import { BillsSection } from "@/components/grant/bills/BillsSection";
import { UserRole } from "@prisma/client";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const statusColor: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  GRANTED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const publicationIcon: Record<string, React.ReactNode> = {
  JOURNAL: <BookOpen className="h-4 w-4" />,
  CONFERENCE: <Microscope className="h-4 w-4" />,
  PATENT: <ShieldCheck className="h-4 w-4" />,
  BOOK_CHAPTER: <ScrollText className="h-4 w-4" />,
  COPYRIGHT: <Award className="h-4 w-4" />,
};

export default function GrantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [grant, setGrant] = React.useState<GrantIn | null>(null);
  const [loading, setLoading] = React.useState(true);

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
        <Loader2 className="w-8 h-8 animate-spin" />
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

  const piAuthors = grant.facultyAuthors.filter(
    (a) => a.role === "FACULTY_PI" || a.role === "FACULTY_COPI",
  );

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col gap-6">
      {/* ── Back + Header ── */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/grant")}
          className="mt-1 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {grant.projectCode ?? "Grant Details"}
            </h1>
            <Badge
              className={`text-xs ${statusColor[grant.grantInStatus] ?? ""}`}
            >
              {grant.grantInStatus.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Grant ID: {grant.id}
          </p>
        </div>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amount Granted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {grant.amountGranted ? fmt(grant.amountGranted) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Amount Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {grant.usedAmount ? fmt(grant.usedAmount) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Application Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {grant.applicationDate
                ? new Date(grant.applicationDate).toLocaleDateString("en-IN")
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {grant.durationOfProject ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Authors ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Faculty Authors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <CardTitle className="text-base">Faculty Authors</CardTitle>
            </div>
            <CardDescription>
              {piAuthors.length} PI / Co-PI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {grant.facultyAuthors.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              grant.facultyAuthors.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-1"
                >
                  <div>
                    <p className="text-sm font-medium">{a.user.name ?? a.user.email}</p>
                    <p className="text-xs text-muted-foreground">{a.user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {a.role.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Student Authors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <CardTitle className="text-base">Student Authors</CardTitle>
            </div>
            <CardDescription>
              {grant.studentAuthors.length} student{grant.studentAuthors.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {grant.studentAuthors.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              grant.studentAuthors.map((a) => (
                <div key={a.id} className="py-1">
                  <p className="text-sm font-medium">{a.user.name ?? a.user.email}</p>
                  <p className="text-xs text-muted-foreground">{a.user.email}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Publication Mappings ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <CardTitle className="text-base">Linked Publications</CardTitle>
          </div>
          <CardDescription>
            {grant.publicationMappings?.length ?? 0} publication(s) mapped to this grant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!grant.publicationMappings || grant.publicationMappings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No publications linked to this grant yet.
            </p>
          ) : (
            <div className="space-y-2">
              {grant.publicationMappings.map((m) => {
                const pub =
                  m.journal ?? m.conference ?? m.patent ?? m.bookChapter ?? m.copyright;
                const title =
                  (pub as any)?.title ?? (pub as any)?.journalName ?? "Untitled";
                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <span className="mt-0.5 text-muted-foreground">
                      {publicationIcon[m.publicationType] ?? <FileText className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {m.publicationType.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Bills ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <CardTitle className="text-base">Bills &amp; Expenses</CardTitle>
          </div>
          <CardDescription>
            {(grant.bills ?? []).filter((b) => !b.isMasterPdf).length} bill(s)
            · Total:{" "}
            {fmt(
              (grant.bills ?? []).reduce((s, b) => s + (b.amount ?? 0), 0)
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
    </div>
  );
}
