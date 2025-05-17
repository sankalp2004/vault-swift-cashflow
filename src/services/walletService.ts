
import { authService } from "./authService";
import { 
  Transaction, 
  WalletBalance, 
  TransferData, 
  DepositData, 
  WithdrawData 
} from "../types/wallet";
import { fraudService } from "./fraudService";
import { toast } from "sonner";

// Mock storage keys
const WALLETS_KEY = "digital_wallet_balances";
const TRANSACTIONS_KEY = "digital_wallet_transactions";

// Helper functions
const getWallets = (): Record<string, WalletBalance> => {
  const walletsJson = localStorage.getItem(WALLETS_KEY);
  if (!walletsJson) return {};
  return JSON.parse(walletsJson);
};

const saveWallets = (wallets: Record<string, WalletBalance>) => {
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
};

const getTransactions = (): Record<string, Transaction[]> => {
  const transactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
  if (!transactionsJson) return {};
  return JSON.parse(transactionsJson);
};

const saveTransactions = (transactions: Record<string, Transaction[]>) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

const generateTransactionId = (): string => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getWallet = (userId: string): WalletBalance => {
  const wallets = getWallets();
  return wallets[userId] || { balance: 0, currency: "USD" };
};

const getUserTransactions = (userId: string): Transaction[] => {
  const transactions = getTransactions();
  return transactions[userId] || [];
};

const saveUserTransaction = (userId: string, transaction: Transaction) => {
  const transactions = getTransactions();
  transactions[userId] = [transaction, ...(transactions[userId] || [])];
  saveTransactions(transactions);
  
  // Check for fraud
  fraudService.checkTransaction(transaction);
};

// Wallet service implementation
export const walletService = {
  getBalance: (): WalletBalance => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    return getWallet(currentUser.id);
  },
  
  getTransactionHistory: (): Transaction[] => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    return getUserTransactions(currentUser.id);
  },
  
  deposit: async (data: DepositData): Promise<WalletBalance> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    if (data.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    
    // Update wallet
    const wallets = getWallets();
    const userWallet = wallets[currentUser.id] || { balance: 0, currency: "USD" };
    userWallet.balance += data.amount;
    wallets[currentUser.id] = userWallet;
    saveWallets(wallets);
    
    // Create transaction record
    const transaction: Transaction = {
      id: generateTransactionId(),
      userId: currentUser.id,
      amount: data.amount,
      type: "deposit",
      description: data.description || "Deposit",
      timestamp: new Date().toISOString()
    };
    
    saveUserTransaction(currentUser.id, transaction);
    
    return userWallet;
  },
  
  withdraw: async (data: WithdrawData): Promise<WalletBalance> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    if (data.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    
    // Check balance
    const wallets = getWallets();
    const userWallet = wallets[currentUser.id] || { balance: 0, currency: "USD" };
    
    if (userWallet.balance < data.amount) {
      throw new Error("Insufficient funds");
    }
    
    // Update wallet
    userWallet.balance -= data.amount;
    wallets[currentUser.id] = userWallet;
    saveWallets(wallets);
    
    // Create transaction record
    const transaction: Transaction = {
      id: generateTransactionId(),
      userId: currentUser.id,
      amount: data.amount,
      type: "withdrawal",
      description: data.description || "Withdrawal",
      timestamp: new Date().toISOString()
    };
    
    saveUserTransaction(currentUser.id, transaction);
    
    return userWallet;
  },
  
  transfer: async (data: TransferData): Promise<WalletBalance> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    
    if (data.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    
    if (currentUser.id === data.recipientId) {
      throw new Error("Cannot transfer to yourself");
    }
    
    // Get all users to find recipient
    const usersJson = localStorage.getItem("digital_wallet_users");
    if (!usersJson) {
      throw new Error("Recipient not found");
    }
    
    const users = JSON.parse(usersJson);
    const recipient = users[data.recipientId];
    
    if (!recipient) {
      throw new Error("Recipient not found");
    }
    
    // Check sender balance
    const wallets = getWallets();
    const senderWallet = wallets[currentUser.id] || { balance: 0, currency: "USD" };
    
    if (senderWallet.balance < data.amount) {
      throw new Error("Insufficient funds");
    }
    
    // Update sender wallet
    senderWallet.balance -= data.amount;
    wallets[currentUser.id] = senderWallet;
    
    // Update recipient wallet
    const recipientWallet = wallets[data.recipientId] || { balance: 0, currency: "USD" };
    recipientWallet.balance += data.amount;
    wallets[data.recipientId] = recipientWallet;
    
    // Save both wallets
    saveWallets(wallets);
    
    // Create transaction records
    const description = data.description || "Transfer";
    const timestamp = new Date().toISOString();
    const transactionId = generateTransactionId();
    
    // Sender transaction (outgoing)
    const senderTransaction: Transaction = {
      id: transactionId,
      userId: currentUser.id,
      amount: data.amount,
      type: "transfer_out",
      description: description,
      relatedUserId: data.recipientId,
      relatedUserName: recipient.name,
      timestamp: timestamp
    };
    
    // Recipient transaction (incoming)
    const recipientTransaction: Transaction = {
      id: transactionId + "_in",
      userId: data.recipientId,
      amount: data.amount,
      type: "transfer_in",
      description: description,
      relatedUserId: currentUser.id,
      relatedUserName: currentUser.name,
      timestamp: timestamp
    };
    
    // Save transactions
    saveUserTransaction(currentUser.id, senderTransaction);
    saveUserTransaction(data.recipientId, recipientTransaction);
    
    return senderWallet;
  },
  
  // Admin functions
  getAllWallets: (): Record<string, WalletBalance> => {
    if (!authService.isAdmin()) {
      throw new Error("Unauthorized");
    }
    
    return getWallets();
  },
  
  getAllTransactions: (): Transaction[] => {
    if (!authService.isAdmin()) {
      throw new Error("Unauthorized");
    }
    
    const transactions = getTransactions();
    return Object.values(transactions).flat();
  },
  
  getFlaggedTransactions: (): Transaction[] => {
    if (!authService.isAdmin()) {
      throw new Error("Unauthorized");
    }
    
    const allTransactions = Object.values(getTransactions()).flat();
    return allTransactions.filter(tx => tx.isFlagged);
  }
};

// Initialize admin wallet with 10,000 if not exists
const initializeAdminWallet = () => {
  const usersJson = localStorage.getItem("digital_wallet_users");
  if (!usersJson) return;
  
  const users = JSON.parse(usersJson);
  const adminUser = Object.values(users).find((user: any) => user.isAdmin);
  
  if (adminUser) {
    const wallets = getWallets();
    if (!wallets[adminUser.id]) {
      wallets[adminUser.id] = { balance: 10000, currency: "USD" };
      saveWallets(wallets);
      toast.success("Admin wallet initialized with $10,000");
    }
  }
};

// Call initialization on module load
setTimeout(initializeAdminWallet, 1000);
