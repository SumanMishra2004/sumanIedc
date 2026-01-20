"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  Radar,
  PolarAngleAxis,
  PolarGrid,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import data from "../data.json";
import  BookChaptersTable  from "@/components/table/BookChapterTable";
const pieData = [
  { name: "Active", value: 45, color: "var(--chart-1)" }, // Vibrant magenta-pink
  { name: "Pending", value: 30, color: "var(--chart-2)" }, // Bright cyan
  { name: "Inactive", value: 25, color: "var(--chart-3)" }, // Electric lime-green
];

const radarData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const areaData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 273, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)", // Vibrant magenta-pink
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)", // Bright cyan
  },
};

export default function DashboardLayout() {
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {pieData.map((entry, index) => (
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
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={"60%"}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
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
                                <strong>{data.name}:</strong> {data.value}%
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
              </div>

              {/* 2 - RADAR CHART */}
              <div className="flex-1 aspect-square bg-card rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    data={radarData}
                    margin={{
                      top: 10,
                      right: 10,
                      bottom: 10,
                      left: 10,
                    }}
                  >
                    <defs>
                      <filter id="radar-glow-desktop" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <filter id="radar-glow-mobile" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    <PolarGrid 
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth={1}
                    />
                    
                    <PolarAngleAxis 
                      dataKey="month"
                      tick={{ fill: '#fff', fontSize: 11 }}
                    />
                    
                    <Radar
                      name="Desktop"
                      dataKey="desktop"
                      stroke={chartConfig.desktop.color}
                      fill={chartConfig.desktop.color}
                      fillOpacity={0.6}
                      strokeWidth={2}
                      filter="url(#radar-glow-desktop)"
                      style={{
                        filter: `drop-shadow(0 0 12px ${chartConfig.desktop.color})`,
                      }}
                    />
                    
                    <Radar
                      name="Mobile"
                      dataKey="mobile"
                      stroke={chartConfig.mobile.color}
                      fill={chartConfig.mobile.color}
                      fillOpacity={0.6}
                      strokeWidth={2}
                      filter="url(#radar-glow-mobile)"
                      style={{
                        filter: `drop-shadow(0 0 12px ${chartConfig.mobile.color})`,
                      }}
                    />
                    
                    <Tooltip 
                      cursor={false}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '20px',
                              padding: '8px 12px',
                            }}>
                              <div style={{ color: '#fff', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>
                                {payload[0].payload.month}
                              </div>
                              {payload.map((entry, index) => (
                                <div key={index} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginTop: index > 0 ? '4px' : '0'
                                }}>
                                  <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: entry.color,
                                    borderRadius: '2px',
                                    boxShadow: `0 0 8px ${entry.color}`
                                  }} />
                                  <div style={{ color: '#fff', fontSize: '13px' }}>
                                    <strong>{entry.name}:</strong> {entry.value}
                                  </div>
                                </div>
                              ))}
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
                        fontSize: '13px',
                        paddingTop: '10px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* 4 - AREA CHART */}
            <div className="aspect-2/1 bg-card rounded-xl">
             <ChartAreaInteractive/>
            </div>
          </div>

          {/* 3 */}
          <div className="hidden md:flex lg:w-1/3 lg:h-auto bg-sky-200 rounded-xl items-center justify-center">
            3
          </div>
        </div>

        {/* 5 */}
     <div className=" flex-1 bg-card rounded-xl w-full shrink-0">
        <BookChaptersTable />
</div>



      </div>
    </div>
  );
}