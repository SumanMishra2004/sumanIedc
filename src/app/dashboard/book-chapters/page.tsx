"use client";

import BookChapterTable from "@/components/book-chapter/BookChapterTable";
import { StatusRadarChart } from "@/components/charts/book-chapter-charts/Pie";
import { ChartAreaGradient } from "@/components/charts/book-chapter-charts/TimeSeriesChart";
import React, { useEffect, useState } from "react";
import { getBookChapterStats } from "@/lib/bookChapterApi";
import { BookChapterStatsResponse } from "@/types/book-chapter";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, DollarSign, FileText, TrendingUp } from "lucide-react";

const Bookchapter = () => {
  const [stats, setStats] = useState<BookChapterStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const response = await getBookChapterStats();
      console.log("Book Chapter Stats Response:", response);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Chapters
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
                  {stats.bookChapterStatusCounts.find((s) => s.status === "PUBLISHED")
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
                statusCounts={stats
                  .bookChapterStatusCounts
                }
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
        </>
      )}
      {/* Stats Cards */}

      {/* Table */}
      <div className="w-full">
        <BookChapterTable />
      </div>
    </div>
  );
};

export default Bookchapter;
