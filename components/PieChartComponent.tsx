import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, CategoryColors, TransactionType } from '../types';

interface Props {
  transactions: Transaction[];
}

const PieChartComponent: React.FC<Props> = ({ transactions }) => {
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);

  const data: { name: string; value: number }[] = Object.values(expenses.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = { name: curr.category, value: 0 };
    }
    acc[curr.category].value += curr.amount;
    return acc;
  }, {} as Record<string, { name: string; value: number }>));

  // Sort by value descending
  data.sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-100">
        <p>暂无支出数据 (No data)</p>
      </div>
    );
  }

  return (
    <div className="h-72 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-lg font-semibold text-slate-700 mb-2">支出分类 (Expenses)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CategoryColors[entry.name as keyof typeof CategoryColors]} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;