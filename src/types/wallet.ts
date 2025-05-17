
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  relatedUserId?: string;
  relatedUserName?: string;
  timestamp: string;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface TransferData {
  recipientId: string;
  amount: number;
  description?: string;
}

export interface DepositData {
  amount: number;
  description?: string;
}

export interface WithdrawData {
  amount: number;
  description?: string;
}

export interface WalletState {
  balance: WalletBalance;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}
