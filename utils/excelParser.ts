import * as XLSX from 'xlsx';
import { 
  CategoryData, 
  MonthlyPerformance, 
  MarketShare, 
  CustomerData, 
  CustomerStatus,
  ProductCategory,
  CATEGORIES 
} from '../types';
import { MOCK_DATA } from '../data/mockData';

interface PerformanceRow {
  month: number;
  lastYearActual: number;
  thisYearTarget: number;
  thisYearActual: number | null;
}

interface CustomerRow {
  name: string;
  revenueYTD: number;
  growth: number;
  cosmax25?: number;
  cosmax26Q1?: number;
  cosmax26Q2?: number;
  cosmax26Q3?: number;
  cosmax26Q4?: number;
  kolmar25?: number;
  kolmar26Q1?: number;
  kolmar26Q2?: number;
  kolmar26Q3?: number;
  kolmar26Q4?: number;
}

const CATEGORY_MAP: Record<string, ProductCategory> = {
  'Sun Care': 'Sun Care',
  'sun care': 'Sun Care',
  'suncare': 'Sun Care',
  'sun': 'Sun Care',
  'Foundation': 'Foundation',
  'foundation': 'Foundation',
  'Essence': 'Essence',
  'essence': 'Essence',
  'Cream': 'Cream',
  'cream': 'Cream',
  '선케어': 'Sun Care',
  '선': 'Sun Care',
  '파운데이션': 'Foundation',
  '에센스': 'Essence',
  '크림': 'Cream',
};

const extractCategoryFromFilename = (filename: string): ProductCategory | null => {
  const nameWithoutExt = filename.replace(/\.(csv|xlsx|xls)$/i, '').toLowerCase();
  
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (nameWithoutExt.includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
};

const normalizeCategory = (name: string): ProductCategory | null => {
  const normalized = name.trim();
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }
  if ((CATEGORIES as readonly string[]).includes(normalized)) {
    return normalized as ProductCategory;
  }
  return null;
};

export const parsePerformanceExcel = async (file: File): Promise<Partial<Record<ProductCategory, MonthlyPerformance[]>>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: Partial<Record<ProductCategory, MonthlyPerformance[]>> = {};
        
        workbook.SheetNames.forEach((sheetName) => {
          const category = normalizeCategory(sheetName);
          if (!category) {
            console.warn(`Unknown category sheet: ${sheetName}`);
            return;
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
          
          const performance: MonthlyPerformance[] = jsonData
            .map((row): MonthlyPerformance | null => {
              const monthValue = row['월'] || row['month'] || row['Month'] || row['MONTH'];
              if (!monthValue) return null;
              
              const month = parseInt(String(monthValue), 10);
              if (isNaN(month) || month < 1 || month > 12) return null;
              
              const lastYearActual = parseFloat(String(
                row['전년실적'] || row['전년 실적'] || row['lastYearActual'] || row['Last Year Actual'] || 0
              ));
              const thisYearTarget = parseFloat(String(
                row['금년목표'] || row['금년 목표'] || row['thisYearTarget'] || row['This Year Target'] || 0
              ));
              const thisYearActualRaw = row['금년실적'] || row['금년 실적'] || row['thisYearActual'] || row['This Year Actual'];
              const thisYearActual = thisYearActualRaw !== undefined && thisYearActualRaw !== null && thisYearActualRaw !== ''
                ? parseFloat(String(thisYearActualRaw))
                : null;
              
              return {
                month,
                lastYearActual: isNaN(lastYearActual) ? 0 : lastYearActual,
                thisYearTarget: isNaN(thisYearTarget) ? 0 : thisYearTarget,
                thisYearActual: thisYearActual !== null && !isNaN(thisYearActual) ? thisYearActual : null,
              };
            })
            .filter((item): item is MonthlyPerformance => item !== null)
            .sort((a, b) => a.month - b.month);
          
          if (performance.length > 0) {
            result[category] = performance;
          }
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseCustomerExcel = async (file: File): Promise<Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>> = {};
        
        workbook.SheetNames.forEach((sheetName) => {
          const category = normalizeCategory(sheetName);
          if (!category) {
            console.warn(`Unknown category sheet: ${sheetName}`);
            return;
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
          
          const customers: CustomerData[] = jsonData
            .map((row, idx): CustomerData | null => {
              const name = String(row['고객사'] || row['고객사명'] || row['name'] || row['Name'] || row['고객'] || '');
              if (!name) return null;
              
              const revenueYTD = parseFloat(String(row['매출'] || row['매출액'] || row['revenueYTD'] || row['Revenue'] || 0));
              const growth = parseFloat(String(row['성장률'] || row['growth'] || row['Growth'] || 0));
              
              const cosmax25 = parseFloat(String(row['코스맥스25'] || row['cosmax25'] || row['Cosmax 25'] || 30));
              const cosmax26Q1 = parseFloat(String(row['코스맥스26Q1'] || row['코스맥스26q1'] || row['cosmax26Q1'] || row['Cosmax 26 Q1'] || cosmax25));
              const cosmax26Q2 = parseFloat(String(row['코스맥스26Q2'] || row['코스맥스26q2'] || row['cosmax26Q2'] || row['Cosmax 26 Q2'] || cosmax26Q1));
              const cosmax26Q3 = parseFloat(String(row['코스맥스26Q3'] || row['코스맥스26q3'] || row['cosmax26Q3'] || row['Cosmax 26 Q3'] || cosmax26Q2));
              const cosmax26Q4 = parseFloat(String(row['코스맥스26Q4'] || row['코스맥스26q4'] || row['cosmax26Q4'] || row['Cosmax 26 Q4'] || cosmax26Q3));
              
              const kolmar25 = parseFloat(String(row['콜마25'] || row['kolmar25'] || row['Kolmar 25'] || 25));
              const kolmar26Q1 = parseFloat(String(row['콜마26Q1'] || row['콜마26q1'] || row['kolmar26Q1'] || row['Kolmar 26 Q1'] || kolmar25));
              const kolmar26Q2 = parseFloat(String(row['콜마26Q2'] || row['콜마26q2'] || row['kolmar26Q2'] || row['Kolmar 26 Q2'] || kolmar26Q1));
              const kolmar26Q3 = parseFloat(String(row['콜마26Q3'] || row['콜마26q3'] || row['kolmar26Q3'] || row['Kolmar 26 Q3'] || kolmar26Q2));
              const kolmar26Q4 = parseFloat(String(row['콜마26Q4'] || row['콜마26q4'] || row['kolmar26Q4'] || row['Kolmar 26 Q4'] || kolmar26Q3));
              
              const shares: MarketShare[] = [
                { period: '25', cosmax: cosmax25 || 30, kolmar: kolmar25 || 25, others: 100 - (cosmax25 || 30) - (kolmar25 || 25) },
                { period: '26 Q1', cosmax: cosmax26Q1 || 30, kolmar: kolmar26Q1 || 25, others: 100 - (cosmax26Q1 || 30) - (kolmar26Q1 || 25) },
                { period: '26 Q2', cosmax: cosmax26Q2 || 30, kolmar: kolmar26Q2 || 25, others: 100 - (cosmax26Q2 || 30) - (kolmar26Q2 || 25) },
                { period: '26 Q3', cosmax: cosmax26Q3 || 30, kolmar: kolmar26Q3 || 25, others: 100 - (cosmax26Q3 || 30) - (kolmar26Q3 || 25) },
                { period: '26 Q4', cosmax: cosmax26Q4 || 30, kolmar: kolmar26Q4 || 25, others: 100 - (cosmax26Q4 || 30) - (kolmar26Q4 || 25) },
              ];
              
              let status: CustomerStatus = 'Stable';
              const shareChange = (cosmax26Q4 || cosmax25) - cosmax25;
              if (growth > 15 && shareChange > 0) {
                status = 'Thriving';
              } else if (growth < -5 || shareChange < -5) {
                status = 'Challenged';
              }
              
              return {
                id: `c-${idx}`,
                name,
                revenueLastYear: 0,
                revenueYTD: isNaN(revenueYTD) ? 0 : Math.round(revenueYTD),
                growth: isNaN(growth) ? 0 : Number(growth.toFixed(1)),
                shares,
                status,
                products: [],
              };
            })
            .filter((item): item is CustomerData => item !== null);
          
          const aggregateShare: MarketShare[] = customers.length > 0
            ? customers[0].shares.map((_, periodIdx) => {
                const avgCosmax = customers.reduce((sum, c) => sum + (c.shares[periodIdx]?.cosmax || 0), 0) / customers.length;
                const avgKolmar = customers.reduce((sum, c) => sum + (c.shares[periodIdx]?.kolmar || 0), 0) / customers.length;
                return {
                  period: customers[0].shares[periodIdx].period,
                  cosmax: Number(avgCosmax.toFixed(1)),
                  kolmar: Number(avgKolmar.toFixed(1)),
                  others: Number((100 - avgCosmax - avgKolmar).toFixed(1)),
                };
              })
            : [];
          
          if (customers.length > 0) {
            result[category] = { customers, aggregateShare };
          }
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

const parseNumericValue = (row: Record<string, unknown>, keys: string[], fallback: number): number => {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseFloat(String(val));
      if (!isNaN(num)) return num;
    }
  }
  return fallback;
};

const parseShareValue = (row: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseFloat(String(val));
      if (!isNaN(num)) {
        return num <= 1 ? Math.round(num * 100) : num;
      }
    }
  }
  return 0;
};

const parseCustomerRow = (row: Record<string, unknown>, idx: number): CustomerData | null => {
  const name = String(row['고객사'] || row['고객사명'] || row['name'] || row['Name'] || row['고객'] || '');
  if (!name) return null;
  
  const revenueYTD = parseNumericValue(row, ['매출', '매출액', 'revenueYTD', 'Revenue'], 0);
  const growth = parseNumericValue(row, ['성장률', 'growth', 'Growth'], 0);
  
  const cosmax25 = parseShareValue(row, ['코스맥스25', 'cosmax25', 'Cosmax 25']);
  const cosmax26Q1 = parseShareValue(row, ['코스맥스26Q1', '코스맥스26q1', 'cosmax26Q1', 'Cosmax 26 Q1']);
  const cosmax26Q2 = parseShareValue(row, ['코스맥스26Q2', '코스맥스26q2', 'cosmax26Q2', 'Cosmax 26 Q2']);
  const cosmax26Q3 = parseShareValue(row, ['코스맥스26Q3', '코스맥스26q3', 'cosmax26Q3', 'Cosmax 26 Q3']);
  const cosmax26Q4 = parseShareValue(row, ['코스맥스26Q4', '코스맥스26q4', 'cosmax26Q4', 'Cosmax 26 Q4']);
  
  const kolmar25 = parseShareValue(row, ['콜마25', 'kolmar25', 'Kolmar 25']);
  const kolmar26Q1 = parseShareValue(row, ['콜마26Q1', '콜마26q1', 'kolmar26Q1', 'Kolmar 26 Q1']);
  const kolmar26Q2 = parseShareValue(row, ['콜마26Q2', '콜마26q2', 'kolmar26Q2', 'Kolmar 26 Q2']);
  const kolmar26Q3 = parseShareValue(row, ['콜마26Q3', '콜마26q3', 'kolmar26Q3', 'Kolmar 26 Q3']);
  const kolmar26Q4 = parseShareValue(row, ['콜마26Q4', '콜마26q4', 'kolmar26Q4', 'Kolmar 26 Q4']);
  
  const shares: MarketShare[] = [
    { period: '25', cosmax: cosmax25, kolmar: kolmar25, others: 100 - cosmax25 - kolmar25 },
    { period: '26 Q1', cosmax: cosmax26Q1, kolmar: kolmar26Q1, others: cosmax26Q1 || kolmar26Q1 ? 100 - cosmax26Q1 - kolmar26Q1 : 0 },
    { period: '26 Q2', cosmax: cosmax26Q2, kolmar: kolmar26Q2, others: cosmax26Q2 || kolmar26Q2 ? 100 - cosmax26Q2 - kolmar26Q2 : 0 },
    { period: '26 Q3', cosmax: cosmax26Q3, kolmar: kolmar26Q3, others: cosmax26Q3 || kolmar26Q3 ? 100 - cosmax26Q3 - kolmar26Q3 : 0 },
    { period: '26 Q4', cosmax: cosmax26Q4, kolmar: kolmar26Q4, others: cosmax26Q4 || kolmar26Q4 ? 100 - cosmax26Q4 - kolmar26Q4 : 0 },
  ];
  
  let status: CustomerStatus = 'Stable';
  const shareChange = cosmax26Q4 - cosmax25;
  if (growth > 15 && shareChange > 0) {
    status = 'Thriving';
  } else if (growth < -5 || shareChange < -5) {
    status = 'Challenged';
  }
  
  return {
    id: `c-${idx}`,
    name,
    revenueLastYear: 0,
    revenueYTD: Math.round(revenueYTD),
    growth: isNaN(growth) ? 0 : Number(growth.toFixed(1)),
    shares,
    status,
    products: [],
  };
};

const calculateAggregateShare = (customers: CustomerData[]): MarketShare[] => {
  if (customers.length === 0) return [];
  
  return customers[0].shares.map((_, periodIdx) => {
    const avgCosmax = customers.reduce((sum, c) => sum + (c.shares[periodIdx]?.cosmax || 0), 0) / customers.length;
    const avgKolmar = customers.reduce((sum, c) => sum + (c.shares[periodIdx]?.kolmar || 0), 0) / customers.length;
    return {
      period: customers[0].shares[periodIdx].period,
      cosmax: Number(avgCosmax.toFixed(1)),
      kolmar: Number(avgKolmar.toFixed(1)),
      others: Number((100 - avgCosmax - avgKolmar).toFixed(1)),
    };
  });
};

export const parseCustomerCSV = async (file: File): Promise<Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>>> => {
  return new Promise((resolve, reject) => {
    const category = extractCategoryFromFilename(file.name);
    if (!category) {
      reject(new Error(`파일명에서 카테고리를 인식할 수 없습니다: ${file.name}\n파일명에 suncare, foundation, essence, cream 중 하나를 포함해주세요.`));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        const customers: CustomerData[] = jsonData
          .map((row, idx) => parseCustomerRow(row, idx))
          .filter((item): item is CustomerData => item !== null);
        
        const aggregateShare = calculateAggregateShare(customers);
        
        const result: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>> = {};
        
        if (customers.length > 0) {
          result[category] = { customers, aggregateShare };
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

interface SalesRow {
  period: string;
  customer: string;
  revenue: number;
}

const parsePeriodToMonth = (period: string): number | null => {
  const str = String(period);
  
  const numVal = parseFloat(str);
  if (!isNaN(numVal) && str.includes('.')) {
    const decimal = numVal - Math.floor(numVal);
    const month = Math.round(decimal * 1000);
    if (month >= 1 && month <= 12) return month;
  }
  
  const match = str.match(/\d{4}\.(\d{1,3})/);
  if (match) {
    const monthNum = parseInt(match[1], 10);
    if (monthNum >= 1 && monthNum <= 12) return monthNum;
    if (monthNum >= 1 && monthNum <= 999) return ((monthNum - 1) % 12) + 1;
  }
  
  const monthMatch = str.match(/(\d{1,2})월/);
  if (monthMatch) return parseInt(monthMatch[1], 10);
  return null;
};

const parseSalesSheet = (worksheet: XLSX.WorkSheet): SalesRow[] => {
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  
  // Debug: show raw column names and first row values
  if (jsonData.length > 0) {
    console.log('[Parser] Raw column names:', Object.keys(jsonData[0]));
    console.log('[Parser] Raw first row values:', jsonData[0]);
  }
  
  return jsonData
    .map((row): SalesRow | null => {
      const period = String(row['기간/연도'] || row['기간'] || row['연도'] || row['연월'] || row['period'] || '');
      const customer = String(row['고객명'] || row['고객사'] || row['고객사명'] || row['customer'] || '_total_');
      const revenueRaw = row['매출'] || row[' 매출 '] || row['매출액'] || row['revenue'] || 0;
      const revenue = parseFloat(String(revenueRaw));
      
      if (!period) return null;
      
      return { period, customer, revenue: isNaN(revenue) ? 0 : revenue };
    })
    .filter((item): item is SalesRow => item !== null);
};

const aggregateMonthlyRevenue = (rows: SalesRow[]): Map<number, number> => {
  const monthlyTotals = new Map<number, number>();
  
  for (const row of rows) {
    const month = parsePeriodToMonth(row.period);
    if (month) {
      monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + row.revenue);
    }
  }
  
  return monthlyTotals;
};

const aggregateCustomerRevenue = (rows: SalesRow[]): Map<string, number> => {
  const customerTotals = new Map<string, number>();
  
  for (const row of rows) {
    customerTotals.set(row.customer, (customerTotals.get(row.customer) || 0) + row.revenue);
  }
  
  return customerTotals;
};

const aggregateCustomerRevenueByMonth = (rows: SalesRow[]): Map<string, Map<number, number>> => {
  const customerMonthly = new Map<string, Map<number, number>>();
  
  for (const row of rows) {
    const month = parsePeriodToMonth(row.period);
    if (!month) continue;
    
    if (!customerMonthly.has(row.customer)) {
      customerMonthly.set(row.customer, new Map());
    }
    const monthMap = customerMonthly.get(row.customer)!;
    monthMap.set(month, (monthMap.get(month) || 0) + row.revenue);
  }
  
  return customerMonthly;
};

export type FileType = 'lastYear' | 'plan' | 'thisYear';

export interface PerformanceAndCustomerData {
  performance: MonthlyPerformance[];
  customerRevenue: Map<string, number>;
  customerRevenueByMonth: Map<string, Map<number, number>>;
  fileType: FileType;
}

const detectFileType = (filename: string, rows: SalesRow[]): FileType => {
  const lowerName = filename.toLowerCase();
  
  const has25 = lowerName.includes('25');
  const has26 = lowerName.includes('26');
  const hasPlan = lowerName.includes('계획') || lowerName.includes('목표') || lowerName.includes('plan') || lowerName.includes('target');
  const hasActual = lowerName.includes('실적') || lowerName.includes('actual');
  
  if (has25) return 'lastYear';
  if (has26 && hasPlan) return 'plan';
  if (has26 && hasActual) return 'thisYear';
  if (has26) return 'thisYear';
  
  if (rows.length > 0) {
    const firstPeriod = rows[0].period;
    if (firstPeriod.startsWith('2025')) return 'lastYear';
    if (firstPeriod.startsWith('2026')) return 'thisYear';
  }
  
  return 'lastYear';
};

export const parsePerformanceFromSalesFile = async (file: File): Promise<Partial<Record<ProductCategory, PerformanceAndCustomerData>>> => {
  return new Promise((resolve, reject) => {
    const category = extractCategoryFromFilename(file.name);
    if (!category) {
      reject(new Error(`파일명에서 카테고리를 인식할 수 없습니다: ${file.name}\n파일명에 suncare, foundation, essence, cream 중 하나를 포함해주세요.`));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('[Parser] Found sheets:', workbook.SheetNames);
        
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = parseSalesSheet(sheet);
        console.log('[Parser] Parsed rows:', rows.length, 'First row:', rows[0]);
        
        const fileType = detectFileType(file.name, rows);
        console.log('[Parser] Detected file type:', fileType);
        
        const monthlyData = aggregateMonthlyRevenue(rows);
        console.log('[Parser] Monthly totals:', Object.fromEntries(monthlyData));
        
        let customerRevenue = new Map<string, number>();
        let customerRevenueByMonth = new Map<string, Map<number, number>>();
        if (fileType === 'lastYear' || fileType === 'thisYear') {
          customerRevenue = aggregateCustomerRevenue(rows);
          customerRevenueByMonth = aggregateCustomerRevenueByMonth(rows);
        }
        
        const performance: MonthlyPerformance[] = [];
        for (let month = 1; month <= 12; month++) {
          const hasData = monthlyData.has(month);
          const value = monthlyData.get(month) || 0;
          
          performance.push({
            month,
            lastYearActual: fileType === 'lastYear' && hasData ? value / 100000000 : 0,
            thisYearTarget: fileType === 'plan' && hasData ? value / 100 : 0,
            thisYearActual: fileType === 'thisYear' && hasData ? value / 100000000 : null,
          });
        }
        
        const customerRevenueInOk = new Map<string, number>();
        for (const [customer, revenue] of customerRevenue) {
          customerRevenueInOk.set(customer, Math.round(revenue / 100000000));
        }
        
        const customerRevenueByMonthInOk = new Map<string, Map<number, number>>();
        for (const [customer, monthMap] of customerRevenueByMonth) {
          const convertedMap = new Map<number, number>();
          for (const [month, revenue] of monthMap) {
            convertedMap.set(month, Math.round(revenue / 100000000));
          }
          customerRevenueByMonthInOk.set(customer, convertedMap);
        }
        
        const result: Partial<Record<ProductCategory, PerformanceAndCustomerData>> = {};
        result[category] = { performance, customerRevenue: customerRevenueInOk, customerRevenueByMonth: customerRevenueByMonthInOk, fileType };
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const mergeWithExistingData = (
  existingData: Record<string, CategoryData>,
  performanceData?: Partial<Record<ProductCategory, MonthlyPerformance[]>>,
  customerData?: Partial<Record<ProductCategory, { customers: CustomerData[], aggregateShare: MarketShare[] }>>,
  revenueLastYear?: Partial<Record<ProductCategory, Record<string, number>>>,
  revenueThisYear?: Partial<Record<ProductCategory, Record<string, number>>>,
  revenueLastYearByMonth?: Partial<Record<ProductCategory, Record<string, Record<number, number>>>>
): Record<string, CategoryData> => {
  const merged = { ...existingData };
  
  CATEGORIES.forEach((category) => {
    const existing = merged[category] || MOCK_DATA[category];
    let customers = customerData?.[category]?.customers || existing.topCustomers;
    
    const lastYearMap = revenueLastYear?.[category] || {};
    const thisYearMap = revenueThisYear?.[category] || {};
    const lastYearByMonthMap = revenueLastYearByMonth?.[category] || {};
    
    const perf = performanceData?.[category] || existing.totalPerformance;
    const ytdMonths = perf.filter(m => m.thisYearActual !== null).map(m => m.month);
    const maxYtdMonth = ytdMonths.length > 0 ? Math.max(...ytdMonths) : 0;
    
    if (Object.keys(thisYearMap).length > 0) {
      const allCustomerNames = new Set([
        ...Object.keys(thisYearMap),
        ...Object.keys(lastYearMap),
      ]);
      
      customers = [];
      for (const customerName of allCustomerNames) {
        const thisYearRev = thisYearMap[customerName] || 0;
        
        let lastYearRevYtd = 0;
        const customerMonthly = lastYearByMonthMap[customerName];
        if (customerMonthly && maxYtdMonth > 0) {
          for (let m = 1; m <= maxYtdMonth; m++) {
            lastYearRevYtd += customerMonthly[m] || 0;
          }
        } else {
          lastYearRevYtd = lastYearMap[customerName] || 0;
        }
        
        let growth = 0;
        if (thisYearRev > 0 && lastYearRevYtd > 0) {
          growth = Number((((thisYearRev - lastYearRevYtd) / lastYearRevYtd) * 100).toFixed(1));
        }
        
        customers.push({
          id: `c-${customers.length}`,
          name: customerName,
          revenueLastYear: lastYearRevYtd,
          revenueYTD: thisYearRev,
          growth,
          shares: [
            { period: '25', cosmax: 0, kolmar: 0, others: 0 },
            { period: '26 Q1', cosmax: 0, kolmar: 0, others: 0 },
            { period: '26 Q2', cosmax: 0, kolmar: 0, others: 0 },
            { period: '26 Q3', cosmax: 0, kolmar: 0, others: 0 },
            { period: '26 Q4', cosmax: 0, kolmar: 0, others: 0 },
          ],
          status: 'Stable',
          products: [],
        });
      }
      
      customers.sort((a, b) => b.revenueYTD - a.revenueYTD);
      console.log('[Merge] Sorted customers (top 5):', customers.slice(0, 5).map(c => ({ name: c.name, revenueYTD: c.revenueYTD })));
    }
    
    merged[category] = {
      ...existing,
      totalPerformance: performanceData?.[category] || existing.totalPerformance,
      topCustomers: customers,
      top20AggregateShare: customerData?.[category]?.aggregateShare || existing.top20AggregateShare,
    };
  });
  
  return merged;
};
