"use client";

import CertificateTable from "@/components/certificate/CertificateTable";
import React, { useEffect, useState } from "react";
import { getCertificateStats } from "@/lib/research/certificateApi";
import { CertificateStats } from "@/types/certificate";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, Globe, Lock, TrendingUp } from "lucide-react";

const CertificatePage = () => {
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await getCertificateStats();
        if (response.data) {
          setStats(response.data);
        } else if (response.error) {
          toast.error("Failed to load statistics", {
            description: response.error,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
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
            <Card className="border-dashed border-2 border-chart-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Certificates
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time records
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Public Records</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.publicCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Visible to everyone
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-2 border-chart-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                   Private Records
                </CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.privateCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Restricted visibility
                </p>
              </CardContent>
            </Card>
            
             <Card className="border-dashed border-2 border-chart-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                   This Month
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                     {(() => {
                        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                        const monthStat = stats.monthWiseCounts.find(m => m.month === currentMonth);
                        return monthStat ? monthStat.count : 0;
                     })()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Added in {new Date().toLocaleString("default", { month: "long" })}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <CertificateTable />
    </div>
  );
};

export default CertificatePage;
