
import { CategoryData, MonthlyPerformance, MarketShare, Facilitator, CustomerData, CustomerStatus } from '../types';

const generateMonthlyData = (baseVal: number, trend: number): MonthlyPerformance[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    lastYearActual: Math.round(baseVal + Math.random() * 20 - 10),
    thisYearTarget: Math.round(baseVal * 1.1 + Math.random() * 10),
    // Limit to month 4 (April) as per user request
    thisYearActual: i < 4 ? Math.round(baseVal * trend + Math.random() * 25 - 10) : null,
  }));
};

const generateMarketShare = (baseCosmax: number, baseKolmar: number): MarketShare[] => {
  const baseOthers = 100 - baseCosmax - baseKolmar;
  return [
    { period: '23', cosmax: baseCosmax, kolmar: baseKolmar, others: baseOthers },
    { period: '24 Q1', cosmax: Math.min(100, baseCosmax + (Math.random() * 4 - 2)), kolmar: Math.min(100, baseKolmar + (Math.random() * 4 - 2)), others: 0 },
    { period: '24 Q2', cosmax: Math.min(100, baseCosmax + (Math.random() * 6 - 3)), kolmar: Math.min(100, baseKolmar + (Math.random() * 6 - 3)), others: 0 },
    { period: '24 Q3', cosmax: Math.min(100, baseCosmax + (Math.random() * 8 - 4)), kolmar: Math.min(100, baseKolmar + (Math.random() * 8 - 4)), others: 0 },
    { period: '24 Q4', cosmax: Math.min(100, baseCosmax + (Math.random() * 10 - 5)), kolmar: Math.min(100, baseKolmar + (Math.random() * 10 - 5)), others: 0 },
  ].map(s => {
    if (s.period === '23') return s;
    const others = Math.max(0, 100 - s.cosmax - s.kolmar);
    return { ...s, others: Number(others.toFixed(1)), cosmax: Number(s.cosmax.toFixed(1)), kolmar: Number(s.kolmar.toFixed(1)) };
  });
};

const CUSTOMER_NAMES = [
  "아모레퍼시픽", "LG생활건강", "클리오", "닥터자르트", "애경산업", 
  "미샤", "네이처리퍼블릭", "이니스프리", "에뛰드", "바닐라코", 
  "롬앤", "페리페라", "구달", "마녀공장", "조선미녀",
  "스킨푸드", "토니모리", "브이티", "가히", "메디힐"
];

const generateTopCustomers = (category: string): CustomerData[] => {
  return CUSTOMER_NAMES.map((name, idx) => {
    const revenue = 100 - (idx * 4) + (Math.random() * 10);
    const growth = (Math.random() * 40) - 15;
    const shares = generateMarketShare(30 + Math.random() * 20, 20 + Math.random() * 20);
    
    // Simple logic to determine status
    let status: CustomerStatus = 'Stable';
    const latestShare = shares[shares.length - 1].cosmax;
    const baseShare = shares[0].cosmax;
    
    if (growth > 15 && latestShare > baseShare) {
      status = 'Thriving';
    } else if (growth < -5 || latestShare < baseShare - 5) {
      status = 'Challenged';
    }

    return {
      id: `c-${idx}`,
      name,
      revenueYTD: Math.round(revenue),
      growth: Number(growth.toFixed(1)),
      shares,
      status
    };
  });
};

const getFacilitators = (cat: string): Facilitator[] => {
  const names: Record<string, string[]> = {
    'Sun Care': ['김선아', '박연구', '최전략'],
    'Foundation': ['이베이스', '장컬러', '정플랜'],
    'Essence': ['한수분', '윤영양', '강효능'],
    'Cream': ['송보습', '임제형', '조기획'],
  };
  const list = names[cat] || ['성명미상', '성명미상', '성명미상'];
  return [
    { role: '마케팅', name: list[0] },
    { role: '연구소', name: list[1] },
    { role: '전략마케팅', name: list[2] },
  ];
};

export const MOCK_DATA: Record<string, CategoryData> = {
  'Sun Care': {
    category: 'Sun Care',
    totalPerformance: generateMonthlyData(550, 1.25),
    top20AggregateShare: generateMarketShare(42, 35),
    topCustomers: generateTopCustomers('Sun Care'),
    facilitators: getFacilitators('Sun Care'),
  },
  'Foundation': {
    category: 'Foundation',
    totalPerformance: generateMonthlyData(420, 0.95),
    top20AggregateShare: generateMarketShare(38, 40),
    topCustomers: generateTopCustomers('Foundation'),
    facilitators: getFacilitators('Foundation'),
  },
  'Essence': {
    category: 'Essence',
    totalPerformance: generateMonthlyData(680, 1.15),
    top20AggregateShare: generateMarketShare(45, 30),
    topCustomers: generateTopCustomers('Essence'),
    facilitators: getFacilitators('Essence'),
  },
  'Cream': {
    category: 'Cream',
    totalPerformance: generateMonthlyData(610, 1.05),
    top20AggregateShare: generateMarketShare(35, 38),
    topCustomers: generateTopCustomers('Cream'),
    facilitators: getFacilitators('Cream'),
  },
};

export const LAST_UPDATE_DATE = '2024-05-20';
export const DATA_PERIOD = '2024.01–2024.04 (YTD)';
