import React, { useRef, useState } from 'react';
import { MonthlyPerformance, MarketShare, CustomerData, ProductCategory, CATEGORIES } from '../types';
import { parsePerformanceExcel, parseCustomerExcel, parseCustomerCSV, parsePerformanceFromSalesFile, PerformanceAndCustomerData, FileType } from '../utils/excelParser';

interface ExcelUploaderProps {
  onPerformanceUpload: (
    data: Partial<Record<ProductCategory, MonthlyPerformance[]>>,
    fileType: 'lastYear' | 'plan' | 'thisYear',
    revenueLastYear?: Partial<Record<ProductCategory, Map<string, number>>>,
    revenueThisYear?: Partial<Record<ProductCategory, Map<string, number>>>,
    revenueLastYearByMonth?: Partial<Record<ProductCategory, Map<string, Map<number, number>>>>
  ) => void;
  onCustomerUpload: (data: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>>) => void;
  onReset: () => void;
}

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onPerformanceUpload, onCustomerUpload, onReset }) => {
  const lastYearInputRef = useRef<HTMLInputElement>(null);
  const planInputRef = useRef<HTMLInputElement>(null);
  const thisYearInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [lastYearStatus, setLastYearStatus] = useState<UploadStatus>('idle');
  const [planStatus, setPlanStatus] = useState<UploadStatus>('idle');
  const [thisYearStatus, setThisYearStatus] = useState<UploadStatus>('idle');
  const [customerStatus, setCustomerStatus] = useState<UploadStatus>('idle');

  const handleLastYearUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setLastYearStatus('loading');
    
    try {
      const file = files[0];
      const data = await parsePerformanceFromSalesFile(file);
      
      let performanceResult: Partial<Record<ProductCategory, MonthlyPerformance[]>> = {};
      let revenueLastYear: Partial<Record<ProductCategory, Map<string, number>>> = {};
      let revenueLastYearByMonth: Partial<Record<ProductCategory, Map<string, Map<number, number>>>> = {};
      
      for (const [category, catData] of Object.entries(data)) {
        performanceResult[category as ProductCategory] = catData.performance;
        revenueLastYear[category as ProductCategory] = catData.customerRevenue;
        revenueLastYearByMonth[category as ProductCategory] = catData.customerRevenueByMonth;
      }
      
      onPerformanceUpload(performanceResult, 'lastYear', revenueLastYear, undefined, revenueLastYearByMonth);
      setLastYearStatus('success');
      setTimeout(() => setLastYearStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to parse lastYear file:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse file');
      setLastYearStatus('error');
      setTimeout(() => setLastYearStatus('idle'), 2000);
    }
    
    if (lastYearInputRef.current) {
      lastYearInputRef.current.value = '';
    }
  };

  const handlePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setPlanStatus('loading');
    
    try {
      const file = files[0];
      const data = await parsePerformanceFromSalesFile(file);
      
      let performanceResult: Partial<Record<ProductCategory, MonthlyPerformance[]>> = {};
      
      for (const [category, catData] of Object.entries(data)) {
        performanceResult[category as ProductCategory] = catData.performance;
      }
      
      onPerformanceUpload(performanceResult, 'plan');
      setPlanStatus('success');
      setTimeout(() => setPlanStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to parse plan file:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse file');
      setPlanStatus('error');
      setTimeout(() => setPlanStatus('idle'), 2000);
    }
    
    if (planInputRef.current) {
      planInputRef.current.value = '';
    }
  };

  const handleThisYearUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setThisYearStatus('loading');
    
    try {
      const file = files[0];
      const data = await parsePerformanceFromSalesFile(file);
      
      let performanceResult: Partial<Record<ProductCategory, MonthlyPerformance[]>> = {};
      let revenueThisYear: Partial<Record<ProductCategory, Map<string, number>>> = {};
      
      for (const [category, catData] of Object.entries(data)) {
        performanceResult[category as ProductCategory] = catData.performance;
        revenueThisYear[category as ProductCategory] = catData.customerRevenue;
      }
      
      onPerformanceUpload(performanceResult, 'thisYear', undefined, revenueThisYear);
      setThisYearStatus('success');
      setTimeout(() => setThisYearStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to parse thisYear file:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse file');
      setThisYearStatus('error');
      setTimeout(() => setThisYearStatus('idle'), 2000);
    }
    
    if (thisYearInputRef.current) {
      thisYearInputRef.current.value = '';
    }
  };

  const handleCustomerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setCustomerStatus('loading');
    
    try {
      let mergedData: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>> = {};
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isCSV = file.name.toLowerCase().endsWith('.csv');
        const data = isCSV ? await parseCustomerCSV(file) : await parseCustomerExcel(file);
        mergedData = { ...mergedData, ...data };
      }
      
      onCustomerUpload(mergedData);
      setCustomerStatus('success');
      setTimeout(() => setCustomerStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to parse customer file:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse file');
      setCustomerStatus('error');
      setTimeout(() => setCustomerStatus('idle'), 2000);
    }
    
    if (customerInputRef.current) {
      customerInputRef.current.value = '';
    }
  };

  const getStatusIndicator = (status: UploadStatus) => {
    if (status === 'loading') return <span className="animate-spin text-xs">⏳</span>;
    if (status === 'success') return <span className="text-emerald-500 text-xs">✓</span>;
    if (status === 'error') return <span className="text-rose-500 text-xs">✕</span>;
    return null;
  };

  const downloadTemplate = (type: 'performance' | 'customer') => {
    const bom = '\uFEFF';
    let csv: string;
    
    if (type === 'performance') {
      const header = ['카테고리', '월', '25년 실적(억)', '26년 목표(억)', '26년 실적(억)'];
      const rows: string[] = [];
      CATEGORIES.forEach(cat => {
        for (let m = 1; m <= 12; m++) {
          rows.push([cat, m, '', '', ''].join(','));
        }
      });
      csv = bom + [header.join(','), ...rows].join('\n');
    } else {
      const header = ['카테고리', '고객사명', '25년 실적(억)', '26년 YTD(억)', '성장률(%)', '상태(Thriving/Stable/Challenged)'];
      const rows = CATEGORIES.map(cat => [cat, '', '', '', '', 'Stable'].join(','));
      csv = bom + [header.join(','), ...rows].join('\n');
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = type === 'performance' ? '실적_템플릿.csv' : '고객사_템플릿.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <input ref={lastYearInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleLastYearUpload} className="hidden" />
      <input ref={planInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handlePlanUpload} className="hidden" />
      <input ref={thisYearInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleThisYearUpload} className="hidden" />
      <input ref={customerInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleCustomerUpload} className="hidden" multiple />
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        Upload
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-slate-200 z-50 w-[600px] max-h-[80vh] overflow-y-auto p-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl font-light"
            >
              ×
            </button>
            
            <h3 className="text-lg font-bold text-slate-800 mb-4">데이터 업로드</h3>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-600 mb-3">실적 데이터</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-slate-600 mb-2">25년 실적</p>
                  <button
                    onClick={() => lastYearInputRef.current?.click()}
                    className="w-full px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                  >
                    파일 선택
                  </button>
                  <div className="mt-2">
                    {getStatusIndicator(lastYearStatus)}
                  </div>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-slate-600 mb-2">26년 목표</p>
                  <button
                    onClick={() => planInputRef.current?.click()}
                    className="w-full px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                  >
                    파일 선택
                  </button>
                  <div className="mt-2">
                    {getStatusIndicator(planStatus)}
                  </div>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-slate-600 mb-2">26년 실적</p>
                  <button
                    onClick={() => thisYearInputRef.current?.click()}
                    className="w-full px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                  >
                    파일 선택
                  </button>
                  <div className="mt-2">
                    {getStatusIndicator(thisYearStatus)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-600 mb-3">고객사 데이터</p>
              <div className="border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-600 mb-2">고객사 점유율</p>
                <button
                  onClick={() => customerInputRef.current?.click()}
                  className="w-full px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                >
                  파일 선택
                </button>
                <div className="mt-2 text-center">
                  {getStatusIndicator(customerStatus)}
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => downloadTemplate('performance')}
                  className="flex-1 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                >
                  실적 템플릿
                </button>
                <button
                  onClick={() => downloadTemplate('customer')}
                  className="flex-1 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                >
                  고객사 템플릿
                </button>
              </div>
              <button
                onClick={() => {
                  if (confirm('저장된 데이터를 모두 초기화하시겠습니까?')) {
                    onReset();
                    setIsOpen(false);
                  }
                }}
                className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
              >
                데이터 초기화
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
