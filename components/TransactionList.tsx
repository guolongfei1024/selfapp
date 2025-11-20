import React from 'react';
import { Transaction, CategoryColors, TransactionType } from '../types';
import { Trash2, TrendingUp } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, onDelete }) => {
  // Sort transactions by date (newest first), then by creation time
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return b.createdAt - a.createdAt;
  });

  if (sortedTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="bg-slate-100 p-4 rounded-full mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <p>暂无交易记录</p>
        <p className="text-sm">请点击麦克风开始记账！</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {sortedTransactions.map((t) => {
        const isExpense = t.type === TransactionType.EXPENSE;
        return (
          <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: CategoryColors[t.category] }}
              >
                {t.category.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-slate-800">{t.description}</p>
                <p className="text-xs text-slate-500">{t.date} • {t.category}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`font-semibold whitespace-nowrap ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
                {isExpense ? '-' : '+'} ¥{t.amount.toFixed(2)}
              </span>
              <button 
                onClick={() => onDelete(t.id)}
                className="p-3 ml-2 bg-red-500 text-white rounded-lg shadow-sm active:bg-red-600 transition-all shrink-0 flex items-center justify-center"
                aria-label="Delete transaction"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;