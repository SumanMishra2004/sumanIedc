"use client";

import ConferenceTable from "@/components/conference/ConferenceTable";
import React, { useEffect, useState } from "react";
import { getConferenceStats } from "@/lib/research/conferenceApi"; 
import { ConferenceStatsResponse } from "@/types/conference";
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

// Placeholder charts if not created yet, comment out specialized imports
// import { StatusRadarChart } from "@/components/charts/conference-charts/Pie"; 
// import { ChartAreaGradient } from "@/components/charts/conference-charts/TimeSeriesChart";

const ConferencesPage = () => {
  const [stats, setStats] = useState<ConferenceStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const response = await getConferenceStats();
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
                  Total Conferences
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
                  {stats.conferenceStatusCounts.find((s) => s.status === "PUBLISHED")
                    ?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully published
                </p>
              </CardContent>
            </Card>

             {/* Add more stats cards as relevant to conferences */}
             <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                {stats.conferenceStatusCounts.find((s) => s.status === "SUBMITTED")
                    ?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts would go here */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <StatusRadarChart data={stats.conferenceStatusCounts} />
            </div>
            <div className="lg:col-span-2">
               <ChartAreaGradient />
            </div>
          </div> */}
        </>
      )}

      <ConferenceTable />
    </div>
  );
};

export default ConferencesPage;
