
import { Transaction } from "../types/wallet";
import { toast } from "sonner";

// Constants for fraud detection
const LARGE_AMOUNT_THRESHOLD = 1000;
const MULTIPLE_TRANSACTIONS_THRESHOLD = 3;
const MULTIPLE_TRANSACTIONS_TIME_WINDOW = 5 * 60 * 1000; // 5 minutes in ms

// Maintain user transactions map for fraud detection
let recentTransactionsMap: Record<string, { timestamp: number; count: number }> = {};

// Mock storage key
const FLAGGED_TRANSACTIONS_KEY = "digital_wallet_flagged_transactions";

const getFlaggedTransactions = (): Record<string, boolean> => {
  const flaggedJson = localStorage.getItem(FLAGGED_TRANSACTIONS_KEY);
  if (!flaggedJson) return {};
  return JSON.parse(flaggedJson);
};

const saveFlaggedTransaction = (transactionId: string) => {
  const flagged = getFlaggedTransactions();
  flagged[transactionId] = true;
  localStorage.setItem(FLAGGED_TRANSACTIONS_KEY, JSON.stringify(flagged));
};

export const fraudService = {
  checkTransaction: (transaction: Transaction) => {
    let isFlagged = false;
    let flagReason = "";
    
    // Check for large amount
    if (transaction.amount >= LARGE_AMOUNT_THRESHOLD) {
      isFlagged = true;
      flagReason = `Large amount transaction: $${transaction.amount}`;
    }
    
    // Check for multiple transactions in short time
    const userId = transaction.userId;
    const now = Date.now();
    
    if (!recentTransactionsMap[userId]) {
      recentTransactionsMap[userId] = { timestamp: now, count: 1 };
    } else {
      const userTransactionData = recentTransactionsMap[userId];
      
      // If within time window, increment count
      if (now - userTransactionData.timestamp < MULTIPLE_TRANSACTIONS_TIME_WINDOW) {
        userTransactionData.count += 1;
        
        // Check if over threshold
        if (userTransactionData.count >= MULTIPLE_TRANSACTIONS_THRESHOLD) {
          isFlagged = true;
          flagReason = `Multiple transactions (${userTransactionData.count}) in a short period`;
        }
      } else {
        // Reset if outside time window
        recentTransactionsMap[userId] = { timestamp: now, count: 1 };
      }
    }
    
    // If flagged, update transaction and notify
    if (isFlagged) {
      // Mark transaction as flagged
      saveFlaggedTransaction(transaction.id);
      
      // Update transaction in storage
      const transactionsKey = "digital_wallet_transactions";
      const transactionsJson = localStorage.getItem(transactionsKey);
      
      if (transactionsJson) {
        const transactions = JSON.parse(transactionsJson);
        
        if (transactions[userId]) {
          const index = transactions[userId].findIndex((tx: Transaction) => tx.id === transaction.id);
          
          if (index !== -1) {
            transactions[userId][index].isFlagged = true;
            transactions[userId][index].flagReason = flagReason;
            localStorage.setItem(transactionsKey, JSON.stringify(transactions));
          }
        }
      }
      
      // In a real app, this would send a notification to admins
      console.warn(`Fraud alert: ${flagReason} for user ${userId}`);
      
      // Show warning toast
      toast.warning("Transaction flagged for review", {
        description: flagReason
      });
    }
    
    return isFlagged;
  },
  
  // Mock daily fraud scan job (would be a cron job in a real app)
  runDailyFraudScan: () => {
    console.log("Running daily fraud scan...");
    
    // In a real app, this would analyze patterns across all transactions
    const transactionsKey = "digital_wallet_transactions";
    const transactionsJson = localStorage.getItem(transactionsKey);
    
    if (transactionsJson) {
      const transactions = JSON.parse(transactionsJson);
      let fraudCount = 0;
      
      Object.entries(transactions).forEach(([userId, userTransactions]) => {
        // Simple example: find unusual patterns like exact same amounts
        const amounts: Record<number, number> = {};
        (userTransactions as Transaction[]).forEach((tx: Transaction) => {
          if (!amounts[tx.amount]) {
            amounts[tx.amount] = 0;
          }
          amounts[tx.amount] += 1;
          
          // Flag if same unusual amount used 3+ times
          if (
            !tx.isFlagged && 
            amounts[tx.amount] >= 3 && 
            tx.amount % 100 !== 0 && // Ignores common amounts like $100, $200
            tx.amount > 50
          ) {
            tx.isFlagged = true;
            tx.flagReason = `Unusual pattern: Amount $${tx.amount} used multiple times`;
            fraudCount++;
          }
        });
      });
      
      if (fraudCount > 0) {
        localStorage.setItem(transactionsKey, JSON.stringify(transactions));
        console.warn(`Daily fraud scan found ${fraudCount} suspicious transactions`);
      }
      
      return fraudCount;
    }
    
    return 0;
  }
};

// Schedule mock daily scan (for demo purposes)
setInterval(() => {
  const flaggedCount = fraudService.runDailyFraudScan();
  if (flaggedCount > 0) {
    toast.warning(`Daily fraud scan complete`,{
      description: `${flaggedCount} suspicious transactions detected`
    });
  }
}, 5 * 60 * 1000); // Run every 5 minutes for demo purposes
