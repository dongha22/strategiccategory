
import React from 'react';
import { CategoryData } from '../types';

interface Props {
  data: CategoryData;
}

export const PerformanceMetrics: React.FC<Props> = ({ data }) => {
  // Use totalPerformance instead of performance to reflect total market summary
  const actuals = data.totalPerformance.filter(p => p.thisYearActual !== null);
  const totalActual = actuals.reduce((acc, curr) => acc + (curr.thisYearActual || 0), 0);
  const totalTarget = actuals.reduce((acc, curr) => acc + curr.thisYearTarget, 0);
  const totalLastYear = actuals.reduce((acc, curr) => acc + curr.lastYearActual, 0);

  const achievementRate = (totalActual / totalTarget) * 100;
  const growthRate = ((totalActual - totalLastYear) / totalLastYear) * 100;
  
  const isHealthy = achievementRate >= 100 && growthRate > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-1">카테고리 총 실적 (YTD)</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-slate-800">{totalActual.toLocaleString()}억</h3>
          <span className="text-xs text-slate-400 font-medium">목표: {totalTarget.toLocaleString()}억</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-1">목표 달성률</p>
        <div className="flex items-center gap-2">
          <h3 className={`text-2xl font-bold ${achievementRate >= 100 ? 'text-blue-600' : 'text-orange-600'}`}>
            {achievementRate.toFixed(1)}%
          </h3>
          <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${achievementRate >= 100 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-700'}`}>
            {achievementRate >= 100 ? '초과달성' : '미달성'}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-1">전년 동기 대비 성장률</p>
        <div className="flex items-center gap-2">
          <h3 className={`text-2xl font-bold ${growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </h3>
          <div className={`p-1 rounded-full ${growthRate >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={growthRate >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
            </svg>
          </div>
        </div>
      </div>

      <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between transition-colors duration-500 ${isHealthy ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-rose-600 border-rose-700 text-white'}`}>
        <div>
          <p className="text-sm font-medium opacity-80 mb-1">카테고리 상태</p>
          <h3 className="text-xl font-bold">{isHealthy ? '양호 (GOOD)' : '관찰 (WATCH)'}</h3>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
           {isHealthy ? (
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           ) : (
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           )}
        </div>
      </div>
    </div>
  );
};
