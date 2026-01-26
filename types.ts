
export type ProductCategory = 'Sun Care' | 'Foundation' | 'Essence' | 'Cream';

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

export interface CustomerData {
  id: string;
  name: string;
  revenueYTD: number;
  growth: number;
  shares: MarketShare[]; // Specific shares for this customer
  status: CustomerStatus;
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
