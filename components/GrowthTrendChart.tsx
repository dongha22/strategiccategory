import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MonthlyPerformance } from '../types';

interface Props {
  data: MonthlyPerformance[];
}

export const GrowthTrendChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map(m => {
    const achievementRate = m.thisYearActual !== null && m.thisYearTarget > 0
      ? Number(((m.thisYearActual / m.thisYearTarget) * 100).toFixed(1))
      : null;
    const growthRate = m.thisYearActual !== null && m.lastYearActual > 0
      ? Number((((m.thisYearActual - m.lastYearActual) / m.lastYearActual) * 100).toFixed(1))
      : null;
    return {
      month: m.month,
      achievementRate,
      growthRate
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xl text-xs min-w-[140px]">
          <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}월</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 mt-1">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.value !== null ? `${entry.value}%` : '-'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
      <h3 className="text-lg font-bold text-slate-800 mb-4">달성률 / 성장률 트렌드</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            tickFormatter={(val) => `${val}월`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '100%', position: 'right', fill: '#94a3b8', fontSize: 10 }} />
          <Line
            name="달성률"
            type="monotone"
            dataKey="achievementRate"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ fill: '#2563eb', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            name="성장률"
            type="monotone"
            dataKey="growthRate"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
