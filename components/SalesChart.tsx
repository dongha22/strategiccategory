
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { MonthlyPerformance } from '../types';

interface Props {
  data: MonthlyPerformance[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MonthlyPerformance;
    const lastYear = data.lastYearActual;
    const target = data.thisYearTarget;
    const actual = data.thisYearActual;
    
    let achievement = null;
    let growth = null;
    
    if (actual !== null) {
      achievement = (actual / target) * 100;
      growth = ((actual - lastYear) / lastYear) * 100;
    }

    return (
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xl text-xs min-w-[140px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}월 실적 현황</p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4 text-slate-500">
            <span>25년 실적:</span>
            <span className="text-slate-800 font-semibold">{Math.round(lastYear).toLocaleString()}억</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-500">
            <span>26년 목표:</span>
            <span className="text-slate-800 font-semibold">{Math.round(target).toLocaleString()}억</span>
          </div>
          {actual !== null ? (
            <>
              <div className="flex justify-between gap-4 text-blue-600 font-bold">
                <span>26년 실적:</span>
                <span>{Math.round(actual).toLocaleString()}억</span>
              </div>
              <div className="pt-1.5 mt-1 border-t border-slate-100 flex flex-col gap-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-medium italic">달성률:</span>
                  <span className={`font-bold ${achievement >= 100 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {achievement.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 font-medium italic">성장률:</span>
                  <span className={`font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {growth >= 0 ? '▲' : '▼'}{Math.abs(growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-slate-400 italic text-center py-1">데이터 집계 전</div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const SalesChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
      <h3 className="text-lg font-bold text-slate-800 mb-4">월별 실적 및 목표 동향 (단위: 억원)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 25, right: 30, left: 0, bottom: 0 }}>
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
            tickFormatter={(val) => Math.round(val).toString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569', paddingBottom: '20px' }}
          />
          <Bar 
            name="25년 실적" 
            dataKey="lastYearActual" 
            fill="#cbd5e1" 
            stroke="#94a3b8"
            barSize={12} 
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            name="26년 목표" 
            dataKey="thisYearTarget" 
            fill="#94a3b8" 
            barSize={12} 
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            name="26년 실적" 
            dataKey="thisYearActual" 
            fill="#2563eb" 
            barSize={12} 
            radius={[2, 2, 0, 0]}
          >
            <LabelList 
              dataKey="thisYearActual" 
              position="top" 
              style={{ fill: '#2563eb', fontSize: '10px', fontWeight: 'bold' }} 
              formatter={(val: number | null) => val !== null ? Math.round(val) : ''}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
