
export const CATEGORIES = ['Sun Care', 'Foundation', 'Essence', 'Cream'] as const;

export type ProductCategory = typeof CATEGORIES[number];

export type CustomerStatus = 'Thriving' | 'Stable' | 'Challenged';

export interface MonthlyPerformance {
  month: number;
  lastYearActual: number;
  thisYearTarget: number;
  thisYearActual: number | null;
}

export interface MarketShare {
  period: string; // '2023 Base', '24 Q1', '24 Q2', etc.
  cosmax: number;
  kolmar: number;
  others: number;
}

export interface Product {
  id: string;
  name: string;
  revenue: number;
  growth: number;
  share: number;
}

export interface CustomerData {
  id: string;
  name: string;
  revenueLastYear: number;
  revenueYTD: number;
  growth: number;
  shares: MarketShare[];
  status: CustomerStatus;
  products: Product[];
}

export interface Facilitator {
  role: '마케팅' | '연구소' | '전략마케팅';
  name: string;
}

export interface CategoryData {
  category: ProductCategory;
  totalPerformance: MonthlyPerformance[]; // Total market performance
  top20AggregateShare: MarketShare[]; // Aggregated share of Top 20
  topCustomers: CustomerData[]; // Individual Top 20 customers
  facilitators: Facilitator[];
}

export interface DashboardState {
  selectedCategory: ProductCategory;
}

export interface MonthColumn extends MonthlyPerformance {
  type: 'month';
}

export interface SummaryColumn {
  type: 'summary';
  month: string; // '상반기' | '하반기' | '연간 합계'
  lastYearActual: number;
  thisYearTarget: number;
  thisYearActual: number | null;
  achievement?: number | null;
  growth?: number | null;
}

export type TableColumn = MonthColumn | SummaryColumn;
