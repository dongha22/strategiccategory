import React from 'react';
import { CustomerData, ProductCategory } from '../types';

interface Props {
  customer: CustomerData;
  category: ProductCategory;
  onClose: () => void;
}

export const ProductListModal: React.FC<Props> = ({ customer, category, onClose }) => {
  const getCategoryDisplayName = (cat: ProductCategory) => {
    switch (cat) {
      case 'Sun Care': return 'Sun Care';
      case 'Foundation': return 'Foundation';
      case 'Essence': return 'Essence';
      case 'Cream': return 'Cream';
      default: return cat;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {getCategoryDisplayName(category)} 품목 리스트
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">총 매출</p>
              <p className="text-2xl font-black text-slate-900">{customer.revenueYTD}억</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">성장률</p>
              <p className={`text-2xl font-black ${customer.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {customer.growth >= 0 ? '+' : ''}{customer.growth}%
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">품목 수</p>
              <p className="text-2xl font-black text-blue-600">{customer.products.length}개</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-bold text-slate-600">품목명</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">매출</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">성장률</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">점유율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{product.revenue}억</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center font-semibold text-xs ${product.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {product.growth >= 0 ? '▲' : '▼'} {Math.abs(product.growth)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {product.share}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
