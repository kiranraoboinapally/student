import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  bgColor?: string;
}

export default function StatCard({ title, value, icon, trend, bgColor = "bg-white/10" }: StatCardProps) {
  return (
    <div className={`${bgColor} backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <div className={`text-xs font-semibold px-2 py-1 rounded ${trend.isPositive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-white/70 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
