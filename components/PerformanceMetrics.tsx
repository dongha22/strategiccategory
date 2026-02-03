
import React from 'react';
import { CategoryData } from '../types';

interface Props {
  data: CategoryData;
}

export const PerformanceMetrics: React.FC<Props> = ({ data }) => {
  const actuals = data.totalPerformance.filter(p => p.thisYearActual !== null);
  
  const totalActual = actuals.reduce((acc, curr) => acc + (curr.thisYearActual || 0), 0);
  const ytdTarget = actuals.reduce((acc, curr) => acc + curr.thisYearTarget, 0);
  const totalLastYear = actuals.reduce((acc, curr) => acc + curr.lastYearActual, 0);
  const annualTarget = data.totalPerformance.reduce((acc, curr) => acc + curr.thisYearTarget, 0);

  const executionTarget = 2000;
  
  const achievementRate = ytdTarget > 0 ? (totalActual / ytdTarget) * 100 : 0;
  const growthRate = totalLastYear > 0 ? ((totalActual - totalLastYear) / totalLastYear) * 100 : 0;
  const progressRate = annualTarget > 0 ? (totalActual / annualTarget) * 100 : 0;
  const executionProgressRate = executionTarget > 0 ? (totalActual / executionTarget) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-2">카테고리 누적 실적 (YTD)</p>
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-bold text-slate-800">{Math.round(totalActual).toLocaleString()}억</h3>
          <div className="text-xs text-slate-500 text-right space-y-0.5">
            <div>연간 사업계획: <span className="font-bold text-slate-700">{Math.round(annualTarget).toLocaleString()}억</span> | 진도율: <span className={`font-bold ${progressRate >= (actuals.length / 12) * 100 ? 'text-blue-600' : 'text-orange-600'}`}>{progressRate.toFixed(1)}%</span></div>
            <div>연간 실행목표: <span className="font-bold text-slate-700">{executionTarget.toLocaleString()}억</span> | 진도율: <span className={`font-bold ${executionProgressRate >= (actuals.length / 12) * 100 ? 'text-blue-600' : 'text-orange-600'}`}>{executionProgressRate.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-1">사업계획 달성률</p>
        <div className="flex items-center gap-2">
          <h3 className={`text-3xl font-bold ${achievementRate >= 100 ? 'text-blue-600' : 'text-orange-600'}`}>
            {achievementRate.toFixed(1)}%
          </h3>
          <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${achievementRate >= 100 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-700'}`}>
            {achievementRate >= 100 ? '초과달성' : '미달성'}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-1">성장률 (YOY)</p>
        <div className="flex items-center gap-2">
          <h3 className={`text-3xl font-bold ${growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
          </h3>
          <div className={`p-1 rounded-full ${growthRate >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={growthRate >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
