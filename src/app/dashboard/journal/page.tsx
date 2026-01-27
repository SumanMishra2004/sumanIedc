"use client";

import JournalTable from "@/components/journal/JournalTable";
import { StatusRadarChart } from "@/components/charts/journal-charts/Pie";
import { ChartAreaGradient } from "@/components/charts/journal-charts/TimeSeriesChart";
import React, { useEffect, useState } from "react";
import { getJournalStats } from "@/lib/journalApi";
import { JournalStatsResponse } from "@/lib/journalApi";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, DollarSign, FileText, TrendingUp, Star } from "lucide-react";

const Journal = () => {
  const [stats, setStats] = useState<JournalStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const response = await getJournalStats();
      console.log("Journal Stats Response:", response);
      if (response.data) {
        setStats(response.data);
      } else if (response.error) {
        toast.error("Failed to load statistics", {
          description: response.error,
        });
      }

      setIsLoading(false);
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[320px] lg:col-span-1" />
          <Skeleton className="h-[320px] lg:col-span-2" />
        </div>
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Journals
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.publicCount} public, {stats.privateCount} private
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.statusCounts.find((s) => s.status === "PUBLISHED")
                    ?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully published
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Impact Factor
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.financials.avgImpactFactor.toFixed(3)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Journal impact score
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Registration Fees
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.financials.totalRegistrationFees.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: ${stats.financials.avgRegistrationFees.toFixed(0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2 "> 
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reimbursement
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.financials.totalReimbursement.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: ${stats.financials.avgReimbursement.toFixed(0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 ">
              <StatusRadarChart
                statusCounts={stats.journalStatusCounts}
                total={stats.total}
              />
            </div>

            <div className="lg:col-span-2">
              <ChartAreaGradient
                monthlyTrend={stats.monthlyTrend}
                dailyTrend={stats.dailyTrend}
                weeklyTrend={stats.weeklyTrend}
                total={stats.total}
              />
            </div>
          </div>

          {/* Display journal type distribution */}
       
       
        </>
      )}

      {/* Table Section */}
      <div className="w-full">
        <JournalTable />
      </div>
    </div>
  );
};

export default Journal;
