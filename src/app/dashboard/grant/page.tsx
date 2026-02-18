"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"
import { Loader2, DollarSign, FileText, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"

import { GrantTable } from "@/components/grant/GrantTable"
import { GrantAddDialog } from "@/components/grant/GrantAddDialog"
import { StatusRadarChart } from "@/components/charts/grant-in-charts/Pie"
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { GrantIn, GrantStatsResponse } from "@/types/grant-in"
import { fetchGrantIns, getGrantStats, deleteGrantIn } from "@/lib/research/grant-in"

export default function GrantPage() {
  const { data: session, status } = useSession()
  const [grants, setGrants] = React.useState<GrantIn[]>([])
  const [stats, setStats] = React.useState<GrantStatsResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [statsLoading, setStatsLoading] = React.useState(true)

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
    } catch (error) {
      console.error(error)
      toast.error("Failed to load grants")
    } finally {
      setLoading(false)
    }
  }, [session])

  const loadStats = React.useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await getGrantStats()
      if (response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (status === "authenticated") {
      loadGrants()
      loadStats()
    }
  }, [status, loadGrants, loadStats])

  const handleDelete = async (grant: GrantIn) => {
    if (confirm("Are you sure you want to delete this grant? This cannot be undone.")) {
      try {
        const result = await deleteGrantIn(grant.id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Grant deleted successfully")
          loadGrants()
          loadStats()
        }
      } catch (error) {
        console.error(error)
        toast.error("An error occurred while deleting")
      }
    }
  }

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

  const userRole = session.user.role as UserRole
  const canCreate = userRole === "ADMIN" || userRole === "FACULTY"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Grants</h1>
          <p className="text-muted-foreground mt-1">
            Manage your research grants and funding applications.
          </p>
        </div>
        
        {canCreate && (
           <GrantAddDialog userRole={userRole} />
        )}
      </div>

      {/* Stats Section */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
            <Card className="border-dashed border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applied</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total grant applications
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Granted Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats.financials.totalAmountGranted)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total funds granted
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Granted Projects</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.grantStatusCounts.find(s => s.status === "GRANTED")?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                   Approved projects
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Used</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.financials.totalUsedAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Funds utilized so far
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <StatusRadarChart 
              statusCounts={Object.fromEntries(stats.grantStatusCounts.map(s => [s.status, s.count]))}
              total={stats.total} 
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-62.5" />
              <Skeleton className="h-100 w-full" />
            </div>
        ) : (
          <GrantTable 
            grants={grants} 
            userRole={userRole} 
            currentUserId={session.user.id} 
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
