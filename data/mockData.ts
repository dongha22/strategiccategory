
import { CategoryData, MonthlyPerformance, MarketShare, Facilitator, CustomerData, CustomerStatus, Product } from '../types';

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
    { period: '25', cosmax: baseCosmax, kolmar: baseKolmar, others: baseOthers },
    { period: '26 Q1', cosmax: Math.min(100, baseCosmax + (Math.random() * 4 - 2)), kolmar: Math.min(100, baseKolmar + (Math.random() * 4 - 2)), others: 0 },
    { period: '26 Q2', cosmax: Math.min(100, baseCosmax + (Math.random() * 6 - 3)), kolmar: Math.min(100, baseKolmar + (Math.random() * 6 - 3)), others: 0 },
    { period: '26 Q3', cosmax: Math.min(100, baseCosmax + (Math.random() * 8 - 4)), kolmar: Math.min(100, baseKolmar + (Math.random() * 8 - 4)), others: 0 },
    { period: '26 Q4', cosmax: Math.min(100, baseCosmax + (Math.random() * 10 - 5)), kolmar: Math.min(100, baseKolmar + (Math.random() * 10 - 5)), others: 0 },
  ].map(s => {
    if (s.period === '25') return s;
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

const PRODUCT_NAMES: Record<string, string[]> = {
  'Sun Care': [
    '워터리 선크림 SPF50+', '톤업 선밀크', '에어리 선스틱', '데일리 UV 에센스',
    '수퍼 프로텍션 선젤', '클리어 선세럼', '모이스처 선로션', '안티에이징 UV크림'
  ],
  'Foundation': [
    '커버 쿠션 파운데이션', '글로우 메쉬 파운데이션', '매트 리퀴드', '하이드라 커버',
    '포어 블러 프라이머', '스킨핏 틴트', '풀커버 컨실러', 'CC크림 올인원'
  ],
  'Essence': [
    '히알루론 앰플 에센스', '비타민C 브라이트닝', '콜라겐 부스터 세럼', '나이아신아마이드 토너',
    '레티놀 안티에이징', '펩타이드 리페어', 'AHA/BHA 필링 에센스', '프로바이오틱 진정 세럼'
  ],
  'Cream': [
    '인텐시브 모이스처 크림', '안티링클 나이트크림', '시카 리페어 밤', '세라마이드 배리어',
    '아이크림 프로', '수분폭탄 젤크림', '영양 리치크림', 'UV 데이크림'
  ]
};

const generateProducts = (category: string): Product[] => {
  const names = PRODUCT_NAMES[category] || PRODUCT_NAMES['Sun Care'];
  const count = 3 + Math.floor(Math.random() * 4);
  const shuffled = [...names].sort(() => Math.random() - 0.5).slice(0, count);
  
  return shuffled.map((name, idx) => ({
    id: `p-${idx}`,
    name,
    revenue: Math.round(5 + Math.random() * 25),
    growth: Number((Math.random() * 50 - 15).toFixed(1)),
    share: Number((10 + Math.random() * 40).toFixed(1))
  }));
};

const generateTopCustomers = (category: string): CustomerData[] => {
  return CUSTOMER_NAMES.map((name, idx) => {
    const revenue = 100 - (idx * 4) + (Math.random() * 10);
    const growth = (Math.random() * 40) - 15;
    const shares = generateMarketShare(30 + Math.random() * 20, 20 + Math.random() * 20);
    
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
      revenueLastYear: Math.round(revenue * (1 - growth / 100)),
      revenueYTD: Math.round(revenue),
      growth: Number(growth.toFixed(1)),
      shares,
      status,
      products: generateProducts(category)
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

export const LAST_UPDATE_DATE = new Date().toISOString().split('T')[0];
export const DATA_PERIOD = '2026.01–2026.04 (YTD)';
