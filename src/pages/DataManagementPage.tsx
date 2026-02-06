import React, { useState, useEffect } from 'react';
import { 
  ProductCategory, 
  CATEGORIES, 
  MonthlyPerformance, 
  CustomerData, 
  Facilitator
} from '../../types';
import { 
  getCategoryId, 
  getMonthlyPerformance, 
  getFacilitators, 
  getCustomers, 
  upsertMonthlyPerformance, 
  upsertFacilitator, 
  upsertCustomer, 
  deleteCustomer 
} from '../lib/database';

interface DataManagementPageProps {
  onBack: () => void;
}

type Tab = 'monthly' | 'customers' | 'facilitators';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const FACILITATOR_ROLES: Facilitator['role'][] = ['마케팅', '연구소', '전략마케팅'];

export function DataManagementPage({ onBack }: DataManagementPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Sun Care');
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [monthlyData, setMonthlyData] = useState<MonthlyPerformance[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [facilitatorData, setFacilitatorData] = useState<Facilitator[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const categoryId = await getCategoryId(selectedCategory);
        if (!categoryId) throw new Error('Category not found');

        if (activeTab === 'monthly') {
          const data = await getMonthlyPerformance(categoryId);
          const filledData = MONTHS.map(month => {
            const existing = data.find(d => d.month === month);
            return existing || {
              month,
              lastYearActual: 0,
              thisYearTarget: 0,
              thisYearActual: null
            };
          });
          if (isMounted) setMonthlyData(filledData);
        } else if (activeTab === 'customers') {
          const data = await getCustomers(categoryId);
          if (isMounted) setCustomerData(data);
        } else if (activeTab === 'facilitators') {
          const data = await getFacilitators(categoryId);
          const filledData = FACILITATOR_ROLES.map(role => {
            const existing = data.find(d => d.role === role);
            return existing || { role, name: '' };
          });
          if (isMounted) setFacilitatorData(filledData);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) showNotification('데이터를 불러오는데 실패했습니다.', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [selectedCategory, activeTab]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMonthlyChange = (month: number, field: keyof MonthlyPerformance, value: string) => {
    const numValue = value === '' ? null : Number(value);
    setMonthlyData(prev => prev.map(row => {
      if (row.month === month) {
        if (field === 'thisYearActual') {
          return { ...row, [field]: numValue };
        } else {
          return { ...row, [field]: numValue || 0 };
        }
      }
      return row;
    }));
  };

  const saveMonthlyData = async () => {
    setSaving(true);
    try {
      await Promise.all(monthlyData.map(row => 
        upsertMonthlyPerformance(selectedCategory, row.month, {
          lastYearActual: row.lastYearActual,
          thisYearTarget: row.thisYearTarget,
          thisYearActual: row.thisYearActual
        })
      ));
      showNotification('월별 실적이 저장되었습니다.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerChange = (index: number, field: keyof CustomerData, value: any) => {
    setCustomerData(prev => prev.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const addCustomer = () => {
    setCustomerData(prev => [
      ...prev,
      {
        id: '',
        name: '',
        revenueLastYear: 0,
        revenueYTD: 0,
        growth: 0,
        status: 'Stable',
        shares: [],
        products: []
      }
    ]);
  };

  const removeCustomer = async (index: number) => {
    const customer = customerData[index];
    if (customer.id) {
      if (!confirm('정말로 이 고객사를 삭제하시겠습니까?')) return;
      try {
        await deleteCustomer(customer.id);
        showNotification('고객사가 삭제되었습니다.', 'success');
      } catch (err) {
        console.error(err);
        showNotification('삭제 중 오류가 발생했습니다.', 'error');
        return;
      }
    }
    setCustomerData(prev => prev.filter((_, i) => i !== index));
  };

  const saveCustomers = async () => {
    setSaving(true);
    try {
      const validCustomers = customerData.filter(c => c.name.trim() !== '');
      
      await Promise.all(validCustomers.map(customer => 
        upsertCustomer(selectedCategory, {
          id: customer.id || undefined,
          name: customer.name,
          revenueLastYear: customer.revenueLastYear,
          revenueYTD: customer.revenueYTD,
          growth: customer.growth,
          status: customer.status
        })
      ));
      
      const categoryId = await getCategoryId(selectedCategory);
      if (categoryId) {
        const refreshedData = await getCustomers(categoryId);
        setCustomerData(refreshedData);
      }
      
      showNotification('고객사 정보가 저장되었습니다.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFacilitatorChange = (role: string, name: string) => {
    setFacilitatorData(prev => prev.map(f => 
      f.role === role ? { ...f, name } : f
    ));
  };

  const saveFacilitators = async () => {
    setSaving(true);
    try {
      await Promise.all(facilitatorData.map(f => 
        upsertFacilitator(selectedCategory, f.role, f.name)
      ));
      showNotification('담당자 정보가 저장되었습니다.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="text-slate-500 hover:text-slate-700 transition-colors font-medium"
            >
              ← 돌아가기
            </button>
            <h1 className="text-xl font-bold text-slate-900">데이터 관리</h1>
          </div>
          {notification && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-fade-in ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {notification.message}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'monthly'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            월별 실적
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'customers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            고객사 관리
          </button>
          <button
            onClick={() => setActiveTab('facilitators')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'facilitators'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            담당자 관리
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              데이터를 불러오는 중...
            </div>
          ) : (
            <>
              {activeTab === 'monthly' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">월별 실적 데이터</h3>
                    <button
                      onClick={saveMonthlyData}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 w-20 text-center">월</th>
                          <th className="px-4 py-3">25년 실적</th>
                          <th className="px-4 py-3">26년 목표</th>
                          <th className="px-4 py-3">26년 실적</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthlyData.map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-center font-medium text-slate-700">{row.month}월</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.lastYearActual}
                                onChange={(e) => handleMonthlyChange(row.month, 'lastYearActual', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.thisYearTarget}
                                onChange={(e) => handleMonthlyChange(row.month, 'thisYearTarget', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.thisYearActual ?? ''}
                                placeholder="-"
                                onChange={(e) => handleMonthlyChange(row.month, 'thisYearActual', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">고객사 목록</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={addCustomer}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        + 추가
                      </button>
                      <button
                        onClick={saveCustomers}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 w-1/4">고객사명</th>
                          <th className="px-4 py-3">25년 실적(억)</th>
                          <th className="px-4 py-3">26년 YTD(억)</th>
                          <th className="px-4 py-3">성장률(%)</th>
                          <th className="px-4 py-3 w-32">상태</th>
                          <th className="px-4 py-3 w-20 text-center">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerData.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleCustomerChange(index, 'name', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="고객사명 입력"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.revenueLastYear}
                                onChange={(e) => handleCustomerChange(index, 'revenueLastYear', Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.revenueYTD}
                                onChange={(e) => handleCustomerChange(index, 'revenueYTD', Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.growth}
                                onChange={(e) => handleCustomerChange(index, 'growth', Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={row.status}
                                onChange={(e) => handleCustomerChange(index, 'status', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                              >
                                <option value="Thriving">Thriving</option>
                                <option value="Stable">Stable</option>
                                <option value="Challenged">Challenged</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removeCustomer(index)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {customerData.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                              등록된 고객사가 없습니다. 추가 버튼을 눌러 등록해주세요.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'facilitators' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">담당자 정보</h3>
                    <button
                      onClick={saveFacilitators}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                  <div className="max-w-2xl">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 w-1/3">부서</th>
                          <th className="px-4 py-3">담당자명</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {facilitatorData.map((row) => (
                          <tr key={row.role} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-700">{row.role}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleFacilitatorChange(row.role, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="이름 입력"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
