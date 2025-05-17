
import { useState, useEffect } from "react";
import { walletService } from "@/services/walletService";
import { Transaction, WalletBalance } from "@/types/wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { User } from "@/types/auth";

const AdminDashboard = () => {
  const [wallets, setWallets] = useState<Record<string, WalletBalance>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load wallets
      const userWallets = walletService.getAllWallets();
      setWallets(userWallets);
      
      // Load transactions
      const allTransactions = walletService.getAllTransactions();
      setTransactions(allTransactions);
      
      // Load flagged transactions
      const flagged = walletService.getFlaggedTransactions();
      setFlaggedTransactions(flagged);
      
      // Load users
      const usersJson = localStorage.getItem("digital_wallet_users");
      if (usersJson) {
        const usersData = JSON.parse(usersJson);
        const cleanUsers: Record<string, User> = {};
        
        // Remove password from user data
        Object.entries(usersData).forEach(([id, userData]: [string, any]) => {
          const { password, ...user } = userData;
          cleanUsers[id] = user as User;
        });
        
        setUsers(cleanUsers);
      }
    } catch (error) {
      toast.error("Failed to load admin data", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalBalance = (): number => {
    return Object.values(wallets).reduce((sum, wallet) => sum + wallet.balance, 0);
  };

  const getTopUsers = (): { id: string; name: string; balance: number }[] => {
    return Object.entries(wallets)
      .map(([userId, wallet]) => ({
        id: userId,
        name: users[userId]?.name || "Unknown User",
        balance: wallet.balance
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  };

  const getRecentTransactions = (): Transaction[] => {
    return [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const getChartData = () => {
    // Group by day for the last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const filteredTx = transactions.filter(tx => 
      new Date(tx.timestamp) >= last7Days
    );
    
    // Group by date
    const groupedByDate: Record<string, {count: number, volume: number}> = {};
    
    filteredTx.forEach(tx => {
      const date = format(new Date(tx.timestamp), 'yyyy-MM-dd');
      if (!groupedByDate[date]) {
        groupedByDate[date] = { count: 0, volume: 0 };
      }
      groupedByDate[date].count += 1;
      groupedByDate[date].volume += tx.amount;
    });
    
    // Convert to array for chart
    return Object.entries(groupedByDate).map(([date, data]) => ({
      date: format(new Date(date), 'MMM dd'),
      transactions: data.count,
      volume: data.volume
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users & Balances</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${getTotalBalance().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {Object.keys(wallets).length} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {flaggedTransactions.length} flagged
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(users).length}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <p>User list will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Transaction list will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Flagged transaction list will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
