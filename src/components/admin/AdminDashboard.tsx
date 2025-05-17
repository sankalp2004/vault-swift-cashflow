import { useState, useEffect } from "react";
import { walletService } from "@/services/walletService";
import { Transaction, WalletBalance } from "@/types/wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { User } from "@/types/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Users, DollarSign, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    const groupedByDate = filteredTx.reduce((acc, tx) => {
      const date = format(new Date(tx.timestamp), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { count: 0, volume: 0 };
      }
      acc[date].count += 1;
      acc[date].volume += tx.amount;
      return acc;
    }, {} as Record<string, {count: number, volume: number}>);
    
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
          <TabsTrigger value="flagged">Flagged Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-12 bg-slate-200 rounded mb-4"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-2xl font-semibold">${getTotalBalance().toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <DollarSign size={24} className="text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-semibold">{Object.keys(users).length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-secondary/10">
                      <Users size={24} className="text-secondary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-semibold">{transactions.length}</p>
                    </div>
                    <div className="p-3 rounded-full bg-accent/10">
                      <ArrowUpDown size={24} className="text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History (7 days)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    {getChartData().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData()}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="transactions" fill="#0070BA" name="Transactions" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No transaction data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Users by Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getTopUsers().length > 0 ? (
                      <ul className="space-y-2">
                        {getTopUsers().map((user) => (
                          <li key={user.id} className="flex justify-between items-center p-2 border-b">
                            <span>{user.name}</span>
                            <span className="font-semibold">${user.balance.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        No users with balance
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {flaggedTransactions.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-red-600">
                      <AlertTriangle size={18} className="mr-2" />
                      Flagged Transactions Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600">
                      There are {flaggedTransactions.length} flagged transactions that need review.
                    </p>
                    <Button 
                      variant="destructive" 
                      className="mt-2"
                      onClick={() => setActiveTab("flagged")}
                    >
                      Review Now
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex justify-between p-3 border-b">
                      <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                      <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : Object.keys(users).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3 text-right">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(users).map(([userId, user]) => {
                        const wallet = wallets[userId] || { balance: 0, currency: "USD" };
                        const userTransactionsCount = transactions.filter(t => t.userId === userId).length;
                        
                        return (
                          <tr key={userId} className="border-b">
                            <td className="px-4 py-3">
                              {user.name}
                              {user.isAdmin && (
                                <Badge variant="secondary" className="ml-2">Admin</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              ${wallet.balance.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {userTransactionsCount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex justify-between p-3 border-b">
                      <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRecentTransactions().map((tx) => {
                        const user = users[tx.userId];
                        
                        let typeLabel, typeColor;
                        switch (tx.type) {
                          case 'deposit':
                            typeLabel = 'Deposit';
                            typeColor = 'text-green-600';
                            break;
                          case 'withdrawal':
                            typeLabel = 'Withdrawal';
                            typeColor = 'text-red-600';
                            break;
                          case 'transfer_in':
                            typeLabel = 'Transfer In';
                            typeColor = 'text-green-600';
                            break;
                          case 'transfer_out':
                            typeLabel = 'Transfer Out';
                            typeColor = 'text-amber-600';
                            break;
                          default:
                            typeLabel = tx.type;
                            typeColor = 'text-slate-600';
                        }
                        
                        return (
                          <tr key={tx.id} className="border-b">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {format(new Date(tx.timestamp), "MMM d, yyyy HH:mm")}
                            </td>
                            <td className="px-4 py-3">
                              {user?.name || 'Unknown User'}
                            </td>
                            <td className={`px-4 py-3 ${typeColor}`}>
                              {typeLabel}
                            </td>
                            <td className="px-4 py-3">
                              {tx.description}
                              {tx.relatedUserName && ` (${tx.relatedUserName})`}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              ${tx.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {tx.isFlagged && (
                                <Badge variant="destructive">
                                  Flagged
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle size={18} className="mr-2 text-red-500" />
                Flagged Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex justify-between p-3 border-b">
                      <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : flaggedTransactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No flagged transactions
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedTransactions.map((tx) => {
                    const user = users[tx.userId];
                    
                    return (
                      <Card key={tx.id} className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium flex items-center">
                                <AlertTriangle size={16} className="mr-2 text-red-500" />
                                {user?.name || 'Unknown User'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(tx.timestamp), "MMM d, yyyy HH:mm")}
                              </p>
                              <p className="mt-2 text-red-600 text-sm">
                                {tx.flagReason}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                ${tx.amount.toFixed(2)}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {tx.type.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-red-200 flex justify-between">
                            <p className="text-sm">{tx.description}</p>
                            <div className="space-x-2">
                              <Button size="sm" variant="destructive">
                                Reject
                              </Button>
                              <Button size="sm" variant="outline">
                                Approve
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
