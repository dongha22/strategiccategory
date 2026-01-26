
import React, { useState } from 'react';
import { ProductCategory, DashboardState, MonthlyPerformance, CATEGORIES, TableColumn } from './types';
import { MOCK_DATA, LAST_UPDATE_DATE, DATA_PERIOD } from './data/mockData';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { SalesChart } from './components/SalesChart';
import { MarketShareChart } from './components/MarketShareChart';
import { CustomerTable } from './components/CustomerTable';

const App: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    selectedCategory: 'Sun Care',
  });

  const currentData = MOCK_DATA[state.selectedCategory];

  const getCategoryDisplayInfo = (cat: ProductCategory) => {
    switch (cat) {
      case 'Sun Care': return { name: 'Sun', icon: '☀️', short: 'Sun' };
      case 'Foundation': return { name: 'Foundation(Mesh&Liquid)', icon: '🎨', short: 'Foundation' };
      case 'Essence': return { name: 'Essence', icon: '💧', short: 'Essence' };
      case 'Cream': return { name: 'Cream', icon: '🧴', short: 'Cream' };
      default: return { name: cat, icon: '✨', short: cat };
    }
  };

  const currentDisplay = getCategoryDisplayInfo(state.selectedCategory);

  // Helper to get full 12 month data and summary columns
  const getTableColumns = (): TableColumn[] => {
    const fullYear = currentData.totalPerformance; // Should be 12 items
    
    const calculateSummary = (months: MonthlyPerformance[]) => {
      const lastYearActual = months.reduce((acc, curr) => acc + curr.lastYearActual, 0);
      const thisYearTarget = months.reduce((acc, curr) => acc + curr.thisYearTarget, 0);
      const thisYearActualArr = months.filter(m => m.thisYearActual !== null);
      const thisYearActual = thisYearActualArr.length > 0 ? thisYearActualArr.reduce((acc, curr) => acc + (curr.thisYearActual || 0), 0) : null;
      
      let achievement: number | null = null;
      if (thisYearActual !== null && thisYearTarget > 0) {
        achievement = (thisYearActual / thisYearTarget) * 100;
      }

      let growth: number | null = null;
      if (thisYearActual !== null && lastYearActual > 0) {
        // Growth should compare against the same period of last year
        const lastYearSamePeriod = thisYearActualArr.reduce((acc, curr) => acc + curr.lastYearActual, 0);
        growth = ((thisYearActual - lastYearSamePeriod) / lastYearSamePeriod) * 100;
      }

      return { lastYearActual, thisYearTarget, thisYearActual, achievement, growth };
    };

    const firstHalf = fullYear.slice(0, 6);
    const secondHalf = fullYear.slice(6, 12);
    
    const firstHalfSummary = calculateSummary(firstHalf);
    const secondHalfSummary = calculateSummary(secondHalf);
    const annualSummary = calculateSummary(fullYear);

    const columns = [
      ...fullYear.slice(0, 6).map(m => ({ ...m, type: 'month' as const })),
      { month: '상반기', ...firstHalfSummary, type: 'summary' as const },
      ...fullYear.slice(6, 12).map(m => ({ ...m, type: 'month' as const })),
      { month: '하반기', ...secondHalfSummary, type: 'summary' as const },
      { month: '연간 합계', ...annualSummary, type: 'summary' as const },
    ];

    return columns;
  };

  const tableColumns = getTableColumns();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">전략품목 유형별 실적 현황</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Strategic Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-6 mr-4 border-r border-slate-200 pr-6">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Data Period</p>
                  <p className="text-sm font-bold text-slate-700">{DATA_PERIOD}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Last Updated</p>
                  <p className="text-sm font-bold text-blue-600">{LAST_UPDATE_DATE}</p>
                </div>
             </div>
             <nav className="flex bg-slate-100 p-1 rounded-lg">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setState({ selectedCategory: cat as ProductCategory })}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      state.selectedCategory === cat 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {getCategoryDisplayInfo(cat as ProductCategory).short}
                  </button>
                ))}
              </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Intro & Facilitators */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentDisplay.icon}</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{currentDisplay.name}</h2>
          </div>
          
          <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
            <div className="flex gap-8">
              {currentData.facilitators.map((f, i) => (
                <div key={i} className="flex flex-col">
                  <p className="text-[10px] font-bold text-blue-600 uppercase leading-none mb-1.5 tracking-tighter">{f.role}</p>
                  <p className="text-sm font-bold text-slate-800">{f.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <PerformanceMetrics data={currentData} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SalesChart data={currentData.totalPerformance} />
          <div className="relative">
            <MarketShareChart data={currentData.top20AggregateShare} />
          </div>
        </div>

        {/* New Customer Table Section */}
        <CustomerTable customers={currentData.topCustomers} />

        {/* Detailed Data Table (Transposed Monthly Summary) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">카테고리 실적 현황</h3>
            <span className="text-xs font-medium text-slate-500 bg-white/50 px-2 py-1 rounded border border-slate-200">(단위 : 억원)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1200px]">
              <tbody className="divide-y divide-slate-100">
                {/* Header Row */}
                <tr>
                  <th className="px-4 py-3 bg-slate-50 text-slate-500 font-medium border-r border-slate-100 text-left w-28 sticky left-0 z-10">월</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center font-bold text-slate-800 ${col.type === 'summary' ? 'bg-blue-50/50 text-blue-800' : 'bg-slate-50/30'}`}>
                      {typeof col.month === 'number' ? `${col.month}월` : col.month}
                    </td>
                  ))}
                </tr>
                {/* Last Year Actual */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left sticky left-0 z-10">전년 실적</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center text-slate-600 ${col.type === 'summary' ? 'font-bold bg-blue-50/20' : ''}`}>
                      {col.lastYearActual.toLocaleString()}
                    </td>
                  ))}
                </tr>
                {/* This Year Target */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left sticky left-0 z-10">금년 목표</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center text-slate-600 ${col.type === 'summary' ? 'font-bold bg-blue-50/20' : ''}`}>
                      {col.thisYearTarget.toLocaleString()}
                    </td>
                  ))}
                </tr>
                {/* This Year Actual */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left sticky left-0 z-10">금년 실적</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center font-bold ${col.type === 'summary' ? 'bg-blue-50/20 text-blue-900' : 'text-slate-900'}`}>
                      {col.thisYearActual !== null ? `${col.thisYearActual.toLocaleString()}` : '-'}
                    </td>
                  ))}
                </tr>
                {/* Achievement Rate */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left sticky left-0 z-10">달성률</th>
                   {tableColumns.map((col, idx) => {
                     const achievement = col.type === 'summary' ? col.achievement : (col.thisYearActual !== null ? (col.thisYearActual / col.thisYearTarget) * 100 : null);
                    return (
                      <td key={idx} className={`px-4 py-3 text-center ${col.type === 'summary' ? 'bg-blue-50/20' : ''}`}>
                        {achievement !== null ? (
                          <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${achievement >= 100 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                            {achievement.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                    );
                  })}
                </tr>
                {/* Growth Rate */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left sticky left-0 z-10">성장률</th>
                   {tableColumns.map((col, idx) => {
                     const growth = col.type === 'summary' ? col.growth : (col.thisYearActual !== null ? ((col.thisYearActual - col.lastYearActual) / col.lastYearActual) * 100 : null);
                    return (
                      <td key={idx} className={`px-4 py-3 text-center ${col.type === 'summary' ? 'bg-blue-50/20' : ''}`}>
                        {growth !== null ? (
                          <span className={`font-bold inline-flex items-center gap-1 text-[11px] ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {growth >= 0 ? '▲' : '▼'}{Math.abs(growth).toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© 2024 Cosmetic ODM Strategic Team. 데이터 출처: 내부 ERP 및 시장 조사 기관 합산.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
