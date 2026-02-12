"use client";

import PatentTable from "@/components/patent/PatentTable";
import React, { useEffect, useState } from "react";
import { getPatentStats } from "@/lib/research/patentApi";
import { PatentStatsResponse } from "@/types/patent";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, CheckCircle, Clock, Lightbulb } from "lucide-react";
import { PatentTimeSeriesChart, PatentStatusRadarChart } from "@/components/charts/patent-charts";

const PatentPage = () => {
  const [stats, setStats] = useState<PatentStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const response = await getPatentStats();
      console.log("Patent Stats Response:", response);
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
          <Skeleton className="h-80 lg:col-span-1" />
          <Skeleton className="h-80 lg:col-span-2" />
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
                  Total Patents
                </CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All patents involved
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Granted</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.granted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully granted
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.underReview}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting decision
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.submitted}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Initially submitted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 ">
              <PatentStatusRadarChart 
                statusCounts={stats.patentStatusCounts}
                total={stats.total}
              />
            </div>

            <div className="lg:col-span-2">
              <PatentTimeSeriesChart 
                filingDateTrends={stats.filingDateTrends}
                submissionDateTrends={stats.submissionDateTrends}
                publicationDateTrends={stats.publicationDateTrends}
                grantDateTrends={stats.grantDateTrends}
              />
            </div>
          </div>
        </>
      )}

      {/* Table Section */}
      <div className="w-full">
        <PatentTable />
      </div>
    </div>
  );
};

export default PatentPage;

