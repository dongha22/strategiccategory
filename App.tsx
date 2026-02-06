
import React, { useState, useEffect } from 'react';
import { ProductCategory, DashboardState, MonthlyPerformance, CATEGORIES, TableColumn, CustomerData, CategoryData, MarketShare } from './types';
import { MOCK_DATA, LAST_UPDATE_DATE } from './data/mockData';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { SalesChart } from './components/SalesChart';
import { MarketShareChart } from './components/MarketShareChart';
import { CustomerTable } from './components/CustomerTable';
import { ProductListModal } from './components/ProductListModal';
import { ExcelUploader } from './components/ExcelUploader';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { useAuthContext } from './src/components/AuthProvider';
import { mergeWithExistingData } from './utils/excelParser';

const STORAGE_KEYS = {
  PERFORMANCE: 'dashboard_performance_data',
  CUSTOMER: 'dashboard_customer_data',
  CUSTOMER_REVENUE: 'dashboard_customer_revenue_data',
  CUSTOMER_REVENUE_LAST_YEAR: 'dashboard_customer_revenue_last_year',
  CUSTOMER_REVENUE_THIS_YEAR: 'dashboard_customer_revenue_this_year',
  CUSTOMER_REVENUE_LAST_YEAR_BY_MONTH: 'dashboard_customer_revenue_last_year_by_month',
};

const App: React.FC = () => {
  const { isAdmin, signOut } = useAuthContext();
  const [state, setState] = useState<DashboardState>({
    selectedCategory: 'Sun Care',
  });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [performanceData, setPerformanceData] = useState<Partial<Record<ProductCategory, MonthlyPerformance[]>>>({});
  const [customerData, setCustomerData] = useState<Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>>>({});
  const [customerRevenueLastYear, setCustomerRevenueLastYear] = useState<Partial<Record<ProductCategory, Record<string, number>>>>({});
  const [customerRevenueThisYear, setCustomerRevenueThisYear] = useState<Partial<Record<ProductCategory, Record<string, number>>>>({});
  const [customerRevenueLastYearByMonth, setCustomerRevenueLastYearByMonth] = useState<Partial<Record<ProductCategory, Record<string, Record<number, number>>>>>({});
  const [dashboardData, setDashboardData] = useState<Record<string, CategoryData>>(MOCK_DATA);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedPerformance = localStorage.getItem(STORAGE_KEYS.PERFORMANCE);
    const savedCustomer = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
    const savedRevenueLastYear = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REVENUE_LAST_YEAR);
    const savedRevenueThisYear = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REVENUE_THIS_YEAR);
    const savedRevenueLastYearByMonth = localStorage.getItem(STORAGE_KEYS.CUSTOMER_REVENUE_LAST_YEAR_BY_MONTH);
    
    let loadedPerformance: Partial<Record<ProductCategory, MonthlyPerformance[]>> = {};
    let loadedCustomer: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>> = {};
    let loadedRevenueLastYear: Partial<Record<ProductCategory, Record<string, number>>> = {};
    let loadedRevenueThisYear: Partial<Record<ProductCategory, Record<string, number>>> = {};
    let loadedRevenueLastYearByMonth: Partial<Record<ProductCategory, Record<string, Record<number, number>>>> = {};
    
    if (savedPerformance) {
      loadedPerformance = JSON.parse(savedPerformance);
      setPerformanceData(loadedPerformance);
    }
    if (savedCustomer) {
      loadedCustomer = JSON.parse(savedCustomer);
      setCustomerData(loadedCustomer);
    }
    if (savedRevenueLastYear) {
      loadedRevenueLastYear = JSON.parse(savedRevenueLastYear);
      setCustomerRevenueLastYear(loadedRevenueLastYear);
    }
    if (savedRevenueThisYear) {
      loadedRevenueThisYear = JSON.parse(savedRevenueThisYear);
      setCustomerRevenueThisYear(loadedRevenueThisYear);
    }
    if (savedRevenueLastYearByMonth) {
      loadedRevenueLastYearByMonth = JSON.parse(savedRevenueLastYearByMonth);
      setCustomerRevenueLastYearByMonth(loadedRevenueLastYearByMonth);
    }
    
    if (savedPerformance || savedCustomer || savedRevenueLastYear || savedRevenueThisYear) {
      setDashboardData(mergeWithExistingData(MOCK_DATA, loadedPerformance, loadedCustomer, loadedRevenueLastYear, loadedRevenueThisYear, loadedRevenueLastYearByMonth));
    }
    
    setIsInitialized(true);
  }, []);

  const handlePerformanceUpload = (
    data: Partial<Record<ProductCategory, MonthlyPerformance[]>>,
    revenueLastYearData?: Partial<Record<ProductCategory, Map<string, number>>>,
    revenueThisYearData?: Partial<Record<ProductCategory, Map<string, number>>>,
    revenueLastYearByMonthData?: Partial<Record<ProductCategory, Map<string, Map<number, number>>>>
  ) => {
    const mergedPerf = { ...performanceData };
    for (const [cat, newPerf] of Object.entries(data)) {
      const category = cat as ProductCategory;
      const existing = mergedPerf[category] || Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        lastYearActual: 0,
        thisYearTarget: 0,
        thisYearActual: null,
      }));
      
      mergedPerf[category] = existing.map((month, idx) => ({
        ...month,
        lastYearActual: newPerf[idx]?.lastYearActual || month.lastYearActual,
        thisYearTarget: newPerf[idx]?.thisYearTarget || month.thisYearTarget,
        thisYearActual: newPerf[idx]?.thisYearActual ?? month.thisYearActual,
      }));
    }
    setPerformanceData(mergedPerf);
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify(mergedPerf));
    
    let mergedLastYear = { ...customerRevenueLastYear };
    let mergedThisYear = { ...customerRevenueThisYear };
    
    if (revenueLastYearData) {
      for (const [cat, revenueMap] of Object.entries(revenueLastYearData)) {
        const revenueObj: Record<string, number> = {};
        for (const [customer, revenue] of revenueMap) {
          revenueObj[customer] = revenue;
        }
        mergedLastYear[cat as ProductCategory] = { ...mergedLastYear[cat as ProductCategory], ...revenueObj };
      }
      setCustomerRevenueLastYear(mergedLastYear);
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_REVENUE_LAST_YEAR, JSON.stringify(mergedLastYear));
    }
    
    if (revenueThisYearData) {
      for (const [cat, revenueMap] of Object.entries(revenueThisYearData)) {
        const revenueObj: Record<string, number> = {};
        for (const [customer, revenue] of revenueMap) {
          revenueObj[customer] = revenue;
        }
        mergedThisYear[cat as ProductCategory] = { ...mergedThisYear[cat as ProductCategory], ...revenueObj };
      }
      setCustomerRevenueThisYear(mergedThisYear);
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_REVENUE_THIS_YEAR, JSON.stringify(mergedThisYear));
    }
    
    let mergedLastYearByMonth = { ...customerRevenueLastYearByMonth };
    if (revenueLastYearByMonthData) {
      for (const [cat, customerMap] of Object.entries(revenueLastYearByMonthData)) {
        const customerObj: Record<string, Record<number, number>> = {};
        for (const [customer, monthMap] of customerMap) {
          const monthObj: Record<number, number> = {};
          for (const [month, revenue] of monthMap) {
            monthObj[month] = revenue;
          }
          customerObj[customer] = monthObj;
        }
        mergedLastYearByMonth[cat as ProductCategory] = { ...mergedLastYearByMonth[cat as ProductCategory], ...customerObj };
      }
      setCustomerRevenueLastYearByMonth(mergedLastYearByMonth);
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_REVENUE_LAST_YEAR_BY_MONTH, JSON.stringify(mergedLastYearByMonth));
    }
    
    setDashboardData(prev => mergeWithExistingData(prev, mergedPerf, customerData, mergedLastYear, mergedThisYear, mergedLastYearByMonth));
  };

  const handleCustomerUpload = (data: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>>) => {
    const merged = { ...customerData, ...data };
    setCustomerData(merged);
    localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(merged));
    setDashboardData(prev => mergeWithExistingData(prev, performanceData, merged, customerRevenueLastYear, customerRevenueThisYear, customerRevenueLastYearByMonth));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEYS.PERFORMANCE);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_REVENUE_LAST_YEAR);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_REVENUE_THIS_YEAR);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_REVENUE_LAST_YEAR_BY_MONTH);
    setPerformanceData({});
    setCustomerData({});
    setCustomerRevenueLastYear({});
    setCustomerRevenueThisYear({});
    setCustomerRevenueLastYearByMonth({});
    setDashboardData(MOCK_DATA);
  };

  const currentData = dashboardData[state.selectedCategory];

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

  const getDataPeriod = (): string => {
    const monthsWithData = currentData.totalPerformance
      .filter(m => m.thisYearActual !== null)
      .map(m => m.month);
    
    if (monthsWithData.length === 0) return '데이터 없음';
    
    const minMonth = Math.min(...monthsWithData);
    const maxMonth = Math.max(...monthsWithData);
    
    return `2026.${String(minMonth).padStart(2, '0')}~2026.${String(maxMonth).padStart(2, '0')}`;
  };

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
    <ProtectedRoute>
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
              {isAdmin && (
                <ExcelUploader 
                  onPerformanceUpload={handlePerformanceUpload}
                  onCustomerUpload={handleCustomerUpload}
                  onReset={handleReset}
                />
              )}
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                Logout
              </button>
              <div className="hidden md:flex items-center gap-6 mr-4 border-r border-slate-200 pr-6">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Data Period</p>
                  <p className="text-sm font-bold text-slate-700">{getDataPeriod()}</p>
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
        <CustomerTable 
          customers={currentData.topCustomers} 
          onCustomerClick={(customer) => setSelectedCustomer(customer)}
        />

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
                  <th className="px-4 py-3 bg-slate-50 text-slate-500 font-medium border-r border-slate-100 text-left w-24 whitespace-nowrap sticky left-0 z-10">월</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center font-bold text-slate-800 whitespace-nowrap ${col.type === 'summary' ? 'bg-blue-50/50 text-blue-800' : 'bg-slate-50/30'}`}>
                      {typeof col.month === 'number' ? `${col.month}월` : col.month}
                    </td>
                  ))}
                </tr>
                {/* Last Year Actual */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left w-24 whitespace-nowrap sticky left-0 z-10">25년 실적</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center text-slate-600 ${col.type === 'summary' ? 'font-bold bg-blue-50/20' : ''}`}>
                      {Math.round(col.lastYearActual).toLocaleString()}
                    </td>
                  ))}
                </tr>
                {/* This Year Target */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left w-24 whitespace-nowrap sticky left-0 z-10">26년 목표</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center text-slate-600 ${col.type === 'summary' ? 'font-bold bg-blue-50/20' : ''}`}>
                      {Math.round(col.thisYearTarget).toLocaleString()}
                    </td>
                  ))}
                </tr>
                {/* This Year Actual */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left w-24 whitespace-nowrap sticky left-0 z-10">26년 실적</th>
                  {tableColumns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3 text-center font-bold ${col.type === 'summary' ? 'bg-blue-50/20 text-blue-900' : 'text-slate-900'}`}>
                      {col.thisYearActual !== null ? Math.round(col.thisYearActual).toLocaleString() : '-'}
                    </td>
                  ))}
                </tr>
                {/* Achievement Rate */}
                <tr>
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left w-24 whitespace-nowrap sticky left-0 z-10">달성률</th>
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
                  <th className="px-4 py-3 bg-white text-slate-500 font-medium border-r border-slate-100 text-left w-24 whitespace-nowrap sticky left-0 z-10">성장률</th>
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

        {selectedCustomer && (
          <ProductListModal
            customer={selectedCustomer}
            category={state.selectedCategory}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default App;
