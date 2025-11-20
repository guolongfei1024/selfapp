export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME'
}

export enum Category {
  FOOD = '餐饮',
  TRANSPORT = '交通',
  SHOPPING = '购物',
  ENTERTAINMENT = '娱乐',
  HOUSING = '居住',
  UTILITIES = '生活缴费',
  HEALTH = '医疗',
  EDUCATION = '教育',
  INCOME = '收入',
  OTHER = '其他'
}

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO Date string
  type: TransactionType;
  createdAt: number;
}

// Helper to map categories to colors
export const CategoryColors: Record<Category, string> = {
  [Category.FOOD]: '#f59e0b', // Amber
  [Category.TRANSPORT]: '#3b82f6', // Blue
  [Category.SHOPPING]: '#ec4899', // Pink
  [Category.ENTERTAINMENT]: '#8b5cf6', // Violet
  [Category.HOUSING]: '#10b981', // Emerald
  [Category.UTILITIES]: '#06b6d4', // Cyan
  [Category.HEALTH]: '#ef4444', // Red
  [Category.EDUCATION]: '#6366f1', // Indigo
  [Category.INCOME]: '#22c55e', // Green
  [Category.OTHER]: '#64748b', // Slate
};