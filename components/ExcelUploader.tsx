import React, { useRef, useState } from 'react';
import { MonthlyPerformance, MarketShare, CustomerData, ProductCategory } from '../types';
import { parsePerformanceExcel, parseCustomerExcel, parseCustomerCSV, parsePerformanceFromSalesFile, PerformanceAndCustomerData, FileType } from '../utils/excelParser';

interface ExcelUploaderProps {
  onPerformanceUpload: (
    data: Partial<Record<ProductCategory, MonthlyPerformance[]>>, 
    revenueLastYear?: Partial<Record<ProductCategory, Map<string, number>>>,
    revenueThisYear?: Partial<Record<ProductCategory, Map<string, number>>>,
    revenueLastYearByMonth?: Partial<Record<ProductCategory, Map<string, Map<number, number>>>>
  ) => void;
  onCustomerUpload: (data: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>>) => void;
  onReset: () => void;
}

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onPerformanceUpload, onCustomerUpload, onReset }) => {
  const performanceInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [performanceStatus, setPerformanceStatus] = useState<UploadStatus>('idle');
  const [customerStatus, setCustomerStatus] = useState<UploadStatus>('idle');

  const handlePerformanceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setPerformanceStatus('loading');
    
    try {
      let performanceResult: Partial<Record<ProductCategory, MonthlyPerformance[]>> = {};
      let revenueLastYear: Partial<Record<ProductCategory, Map<string, number>>> = {};
      let revenueThisYear: Partial<Record<ProductCategory, Map<string, number>>> = {};
      let revenueLastYearByMonth: Partial<Record<ProductCategory, Map<string, Map<number, number>>>> = {};
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await parsePerformanceFromSalesFile(file);
        
        for (const [category, catData] of Object.entries(data)) {
          performanceResult[category as ProductCategory] = catData.performance;
          
          if (catData.fileType === 'lastYear') {
            revenueLastYear[category as ProductCategory] = catData.customerRevenue;
            revenueLastYearByMonth[category as ProductCategory] = catData.customerRevenueByMonth;
          } else if (catData.fileType === 'thisYear') {
            revenueThisYear[category as ProductCategory] = catData.customerRevenue;
          }
        }
      }
      
      onPerformanceUpload(performanceResult, revenueLastYear, revenueThisYear, revenueLastYearByMonth);
      setPerformanceStatus('success');
      setTimeout(() => setPerformanceStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to parse performance file:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse file');
      setPerformanceStatus('error');
      setTimeout(() => setPerformanceStatus('idle'), 2000);
    }
    
    if (performanceInputRef.current) {
      performanceInputRef.current.value = '';
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

  return (
    <div className="relative">
      <input ref={performanceInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handlePerformanceUpload} className="hidden" multiple />
      <input ref={customerInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleCustomerUpload} className="hidden" multiple />
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        Upload
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-40">
            <button
              onClick={() => { performanceInputRef.current?.click(); }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>실적 테이블</span>
              {getStatusIndicator(performanceStatus)}
            </button>
            <button
              onClick={() => { customerInputRef.current?.click(); }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
            >
              <span>고객사 점유율</span>
              {getStatusIndicator(customerStatus)}
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={() => { 
                if (confirm('저장된 데이터를 모두 초기화하시겠습니까?')) {
                  onReset();
                  setIsOpen(false);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              데이터 초기화
            </button>
          </div>
        </>
      )}
    </div>
  );
};
