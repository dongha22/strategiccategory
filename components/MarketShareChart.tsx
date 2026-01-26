
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { MarketShare } from '../types';

interface Props {
  data: MarketShare[];
}

export const MarketShareChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">제조사별 점유율 변동 현황 (Top 20 합산)</h3>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-700 rounded-sm"></span>
          <span className="text-xs text-slate-500">코스맥스</span>
          <span className="w-3 h-3 bg-sky-500 rounded-sm ml-2"></span>
          <span className="text-xs text-slate-500">콜마</span>
          <span className="w-3 h-3 bg-slate-300 rounded-sm ml-2"></span>
          <span className="text-xs text-slate-500">기타</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            hide 
          />
          <YAxis 
            dataKey="period" 
            type="category" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
            width={80}
          />
          <Tooltip 
            formatter={(value) => `${value}%`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          
          <Bar dataKey="cosmax" stackId="a" barSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-cosmax-${index}`} fill={entry.period === '23' ? '#f87171' : '#b91c1c'} />
            ))}
            <LabelList 
              dataKey="cosmax" 
              position="insideLeft" 
              formatter={(val: number) => `${Math.round(val)}%`}
              style={{ fill: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}
            />
          </Bar>

          <Bar dataKey="kolmar" stackId="a">
            {data.map((entry, index) => (
              <Cell key={`cell-kolmar-${index}`} fill={entry.period === '23' ? '#7dd3fc' : '#0ea5e9'} />
            ))}
          </Bar>

          <Bar dataKey="others" stackId="a" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-others-${index}`} fill={entry.period === '23' ? '#cbd5e1' : '#e2e8f0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
