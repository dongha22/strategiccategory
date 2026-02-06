import { CategoryData, MonthlyPerformance, CustomerData } from '../types';

function escapeCSV(value: string | number | null): string {
  if (value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportPerformanceCSV(data: CategoryData): void {
  const header = ['월', '25년 실적', '26년 목표', '26년 실적', '달성률(%)', '성장률(%)'];
  const rows = data.totalPerformance.map((m: MonthlyPerformance) => {
    const achievement = m.thisYearActual !== null && m.thisYearTarget > 0
      ? ((m.thisYearActual / m.thisYearTarget) * 100).toFixed(1)
      : '';
    const growth = m.thisYearActual !== null && m.lastYearActual > 0
      ? (((m.thisYearActual - m.lastYearActual) / m.lastYearActual) * 100).toFixed(1)
      : '';
    return [
      `${m.month}월`,
      m.lastYearActual,
      m.thisYearTarget,
      m.thisYearActual,
      achievement,
      growth
    ].map(escapeCSV).join(',');
  });

  const bom = '\uFEFF';
  const csv = bom + [header.join(','), ...rows].join('\n');
  downloadFile(csv, `${data.category}_월별실적.csv`, 'text/csv;charset=utf-8');
}

export function exportCustomerCSV(data: CategoryData): void {
  const header = ['순위', '고객사명', '25년 실적(억)', '26년 YTD(억)', '성장률(%)', '상태'];
  const rows = data.topCustomers.map((c: CustomerData, idx: number) => {
    return [
      idx + 1,
      c.name,
      c.revenueLastYear,
      c.revenueYTD,
      c.growth,
      c.status
    ].map(escapeCSV).join(',');
  });

  const bom = '\uFEFF';
  const csv = bom + [header.join(','), ...rows].join('\n');
  downloadFile(csv, `${data.category}_고객사.csv`, 'text/csv;charset=utf-8');
}

export function exportFullDataCSV(data: CategoryData): void {
  const sections: string[] = [];
  const bom = '\uFEFF';

  sections.push(`[${data.category}] 월별 실적`);
  sections.push(['월', '25년 실적', '26년 목표', '26년 실적'].join(','));
  data.totalPerformance.forEach(m => {
    sections.push([`${m.month}월`, m.lastYearActual, m.thisYearTarget, m.thisYearActual].map(escapeCSV).join(','));
  });

  sections.push('');
  sections.push(`[${data.category}] 고객사`);
  sections.push(['고객사명', '25년 실적(억)', '26년 YTD(억)', '성장률(%)', '상태'].join(','));
  data.topCustomers.forEach(c => {
    sections.push([c.name, c.revenueLastYear, c.revenueYTD, c.growth, c.status].map(escapeCSV).join(','));
  });

  sections.push('');
  sections.push(`[${data.category}] 담당자`);
  sections.push(['역할', '이름'].join(','));
  data.facilitators.forEach(f => {
    sections.push([f.role, f.name].map(escapeCSV).join(','));
  });

  const csv = bom + sections.join('\n');
  downloadFile(csv, `${data.category}_전체데이터.csv`, 'text/csv;charset=utf-8');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
