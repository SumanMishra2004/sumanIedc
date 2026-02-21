"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Loader2, Receipt } from "lucide-react"
import { toast } from "sonner"
import { UserRole } from "@prisma/client"

import { GrantIn } from "@/types/grant-in"
import { fetchGrantIns } from "@/lib/research/grant-in"
import { BillsSection } from "@/components/grant/bills/BillsSection"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function BillsPage() {
  const { data: session, status } = useSession()
  const [grants, setGrants] = React.useState<GrantIn[]>([])
  const [loading, setLoading] = React.useState(true)

  const currentUserId = session?.user?.id ?? ""
  const userRole = (session?.user?.role as UserRole) ?? UserRole.STUDENT

  const loadGrants = React.useCallback(async () => {
    if (!session?.user) return
    try {
      setLoading(true)
      const response = await fetchGrantIns()
      if (response.data?.grants) {
        setGrants(response.data.grants)
      } else if (response.error) {
        toast.error(response.error)
      }
    } catch {
      toast.error("Failed to load grants")
    } finally {
      setLoading(false)
    }
  }, [session])

  React.useEffect(() => {
    if (status === "authenticated") loadGrants()
  }, [status, loadGrants])

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>Please sign in to view this page.</p>
      </div>
    )
  }

  const grantsWithBills = grants.filter((g) =>
    (g.bills ?? []).some((b) => !b.isMasterPdf)
  )
  const totalBills = grants.reduce(
    (acc, g) => acc + (g.bills ?? []).filter((b) => !b.isMasterPdf).length,
    0
  )
  const pendingBills = grants.reduce(
    (acc, g) =>
      acc + (g.bills ?? []).filter((b) => !b.isMasterPdf && b.billStatus === "PENDING").length,
    0
  )
  const totalAmount = grants.reduce(
    (acc, g) =>
      acc +
      (g.bills ?? []).filter((b) => !b.isMasterPdf).reduce((s, b) => s + (b.amount ?? 0), 0),
    0
  )

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bills</h1>
        <p className="text-muted-foreground mt-1">
          All expense bills across your research grants.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-dashed border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBills}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {grantsWithBills.length} grant(s)
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Badge variant="secondary" className="text-xs">{pendingBills}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{pendingBills}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{fmt(totalAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sum of all bill amounts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bills grouped by grant */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : grants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Receipt className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p className="text-lg font-medium">No grants found</p>
          <p className="text-sm mt-1">
            You are not a member of any research grant yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grants.map((grant) => {
            const isPiOrCoPi = grant.facultyAuthors.some(
              (a) =>
                a.userId === currentUserId &&
                (a.role === "FACULTY_PI" || a.role === "FACULTY_COPI")
            )
            const isMember =
              grant.facultyAuthors.some((a) => a.userId === currentUserId) ||
              grant.studentAuthors.some((a) => a.userId === currentUserId)

            return (
              <Collapsible key={grant.id} defaultOpen>
                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {grant.projectCode || "Unnamed Grant"}
                        </span>
                        <Badge
                          variant={
                            grant.grantInStatus === "GRANTED"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {grant.grantInStatus}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(grant.bills ?? []).filter((b) => !b.isMasterPdf).length} bill(s)
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-5 pt-2 border-t bg-muted/10">
                      <BillsSection
                        bills={grant.bills ?? []}
                        grantId={grant.id}
                        userRole={userRole}
                        currentUserId={currentUserId}
                        isPiOrCoPi={isPiOrCoPi}
                        isMember={isMember}
                        onBillsChange={loadGrants}
                      />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>
      )}
    </div>
  )
}
