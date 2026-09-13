export type TransactionType = 'income' | 'expense';

export class Transaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  note?: string;
  date: Date;
  createdAt: Date;
}
