"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import  BookChaptersTable  from "@/components/table/BookChapterTable";
import { getBookChapterStats } from "@/lib/bookChapterApi";
import { BookChapterStatsResponse } from "@/types/book-chapter";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function DashboardLayout() {
  const [stats, setStats] = useState<BookChapterStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await getBookChapterStats();
      if (response.data) {
        setStats(response.data);
      } else if (response.error) {
        toast.error("Failed to load statistics", {
          description: response.error
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Transform stats for pie chart
  const statusPieData = stats?.statusCounts.map((s, index) => ({
    name: s.status.replace(/_/g, " "),
    value: s.count,
    color: `var(--chart-${(index % 5) + 1})`
  })) || [];

  return (
    <div className="p-4 bg-slate-900 min-h-screen text-black max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4">

        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Left Column */}
          <div className="flex flex-col gap-4 flex-1">

            {/* 1 & 2 */}
            <div className="flex gap-4">

              {/* 1 - PIE CHART */}
              <div className="flex-1 aspect-square bg-card rounded-xl">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {statusPieData.map((entry, index) => (
                        <filter key={`glow-${index}`} id={`glow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      ))}
                    </defs>
                    
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={"60%"}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="none"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          filter={`url(#glow-${index})`}
                          style={{
                            filter: `drop-shadow(0 0 20px ${entry.color})`,
                          }}
                        />
                      ))}
                    </Pie>
                    
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        color: '#fff',
                        height: 'fit-content',
                        padding: '8px 12px'
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '20px',
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: data.payload.color,
                                borderRadius: '2px',
                                boxShadow: `0 0 8px ${data.payload.color}`
                              }} />
                              <div style={{ color: '#fff', fontSize: '14px' }}>
                                <strong>{data.name}:</strong> {data.value}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Legend 
                      verticalAlign="bottom" 
                      iconType="circle"
                      wrapperStyle={{
                        color: '#fff',
                        fontSize: '14px',
                        paddingTop: '5px',
                        paddingBottom: '5px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>

              {/* 2 - Recent Activity Card */}
              <div className="flex-1 aspect-square bg-card rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 text-foreground">Recent Chapters</h3>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : stats?.recentChapters && stats.recentChapters.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentChapters.slice(0, 5).map((chapter) => (
                      <div key={chapter.id} className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium text-sm line-clamp-1">{chapter.title}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {chapter.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(chapter.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[calc(100%-2rem)] text-muted-foreground text-sm">
                    No recent chapters
                  </div>
                )}
              </div>

            </div>

            {/* 4 - AREA CHART */}
            <div className="aspect-2/1 bg-card rounded-xl">
             <ChartAreaInteractive/>
            </div>
          </div>
          {/* Stats Card */}
          <div className="hidden md:flex lg:w-1/3 lg:h-auto bg-card rounded-xl p-6 flex-col gap-4">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <>
                <h3 className="text-xl font-bold">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Chapters</span>
                    <span className="text-2xl font-bold">{stats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Public</span>
                    <span className="text-xl font-semibold">{stats?.publicCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Private</span>
                    <span className="text-xl font-semibold">{stats?.privateCount || 0}</span>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-semibold">Financials</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Fees</span>
                        <span className="font-medium">${stats?.financials.totalRegistrationFees.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Reimbursement</span>
                        <span className="font-medium">${stats?.financials.totalReimbursement.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 5 - Table */}
        <div className="flex-1 bg-card rounded-xl w-full shrink-0">
          <BookChaptersTable onRefresh={handleRefresh} />
        </div>

      </div>
    </div>
  );
}
