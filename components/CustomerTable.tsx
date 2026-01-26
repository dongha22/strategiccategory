
import React from 'react';
import { CustomerData, CustomerStatus } from '../types';

interface Props {
  customers: CustomerData[];
}

const StatusBadge: React.FC<{ status: CustomerStatus }> = ({ status }) => {
  const styles = {
    Thriving: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Stable: 'bg-slate-50 text-slate-600 border-slate-200',
    Challenged: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const labels = {
    Thriving: 'Thriving',
    Stable: 'Stable',
    Challenged: 'Challenged',
  };

  const dotColors = {
    Thriving: 'bg-emerald-500',
    Stable: 'bg-slate-400',
    Challenged: 'bg-rose-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`}></span>
      {labels[status]}
    </span>
  );
};

export const CustomerTable: React.FC<Props> = ({ customers }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">top20 고객사 점유율 추이</h3>
          <p className="text-xs text-slate-500 mt-0.5">고객사별 Cosmax vs Kolmar 점유율 변동 추이 및 종합 진단</p>
        </div>
        <span className="text-xs text-slate-400">단위: 억 원 / %</span>
      </div>
      
      {/* Scrollable container for the table body */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <table className="w-full text-left text-sm border-collapse relative">
          <thead className="text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
            <tr className="bg-slate-50 border-b border-slate-200">
              <th rowSpan={2} className="px-6 py-3 w-12 text-center border-r border-slate-200 bg-slate-50">순위</th>
              <th rowSpan={2} className="px-4 py-3 w-32 border-r border-slate-200 bg-slate-50">고객사명</th>
              <th rowSpan={2} className="px-4 py-3 w-28 text-right border-r border-slate-200 bg-slate-50">금년 실적</th>
              <th rowSpan={2} className="px-4 py-3 w-24 text-right border-r border-slate-200 bg-slate-50">성장률</th>
              <th colSpan={5} className="px-6 py-2 text-center border-b border-slate-200 bg-slate-50">제조사별 점유율 추이</th>
              <th rowSpan={2} className="px-6 py-3 w-32 text-center border-l border-slate-200 bg-slate-50">비즈니스 상태</th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-2 py-2 text-center text-[11px] w-[100px] border-r border-slate-200 bg-slate-50">23</th>
              <th className="px-2 py-2 text-center text-[11px] w-[100px] border-r border-slate-200 bg-slate-50">Q1</th>
              <th className="px-2 py-2 text-center text-[11px] w-[100px] border-r border-slate-200 bg-slate-50">Q2</th>
              <th className="px-2 py-2 text-center text-[11px] w-[100px] border-r border-slate-200 bg-slate-50">Q3</th>
              <th className="px-2 py-2 text-center text-[11px] w-[100px] bg-slate-50">Q4</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {customers.map((c, idx) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4 text-center font-bold text-slate-400 group-hover:text-blue-600 transition-colors border-r border-slate-100/50">
                  {idx + 1}
                </td>
                <td className="px-4 py-4 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100/50">{c.name}</td>
                <td className="px-4 py-4 text-right font-medium text-slate-900 whitespace-nowrap border-r border-slate-100/50">{c.revenueYTD}억</td>
                <td className="px-4 py-4 text-right border-r border-slate-100/50">
                  <span className={`inline-flex items-center font-semibold text-xs ${c.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {c.growth >= 0 ? '▲' : '▼'} {Math.abs(c.growth)}%
                  </span>
                </td>
                {c.shares.map((s, sIdx) => {
                  const isLastYear = s.period === '23';
                  return (
                    <td key={sIdx} className={`px-3 py-4 ${sIdx !== 4 ? 'border-r border-slate-100/30' : ''}`}>
                      <div className="flex flex-col gap-1">
                        <div className={`h-2.5 rounded-full overflow-hidden flex shadow-inner border ${isLastYear ? 'bg-slate-100 border-slate-200 opacity-80' : 'bg-slate-100 border-slate-100'}`}>
                          <div 
                            style={{ width: `${s.cosmax}%` }} 
                            className={`${isLastYear ? 'bg-red-400' : 'bg-red-700'} h-full transition-all duration-500`} 
                            title={`Cosmax: ${s.cosmax}%`}
                          />
                          <div 
                            style={{ width: `${s.kolmar}%` }} 
                            className={`${isLastYear ? 'bg-sky-400' : 'bg-sky-500'} h-full transition-all duration-500`} 
                            title={`Kolmar: ${s.kolmar}%`}
                          />
                          <div 
                            style={{ width: `${s.others}%` }} 
                            className={`${isLastYear ? 'bg-slate-300' : 'bg-slate-200'} h-full transition-all duration-500`} 
                            title={`Others: ${s.others}%`}
                          />
                        </div>
                        <div 
                          className="flex justify-end"
                          style={{ width: `${Math.max(s.cosmax, 30)}%` }}
                        >
                          <span className={`text-[9px] font-bold ${isLastYear ? 'text-red-400' : 'text-red-700'}`}>
                            {Math.round(s.cosmax)}%
                          </span>
                        </div>
                      </div>
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-center border-l border-slate-100/50">
                   <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-2">
           <div className="w-3 h-1.5 bg-red-700 rounded-full"></div>
           <span className="text-[10px] font-bold text-slate-500 uppercase">코스맥스</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-1.5 bg-sky-500 rounded-full"></div>
           <span className="text-[10px] font-bold text-slate-500 uppercase">콜마</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-1.5 bg-slate-200 rounded-full"></div>
           <span className="text-[10px] font-bold text-slate-500 uppercase">기타</span>
        </div>
        <div className="ml-auto">
           <span className="text-[9px] text-slate-400 italic">※ 흐린 막대는 전년(23년) 베이스 데이터입니다. 스크롤하여 전체 데이터를 확인하세요.</span>
        </div>
      </div>
    </div>
  );
};
