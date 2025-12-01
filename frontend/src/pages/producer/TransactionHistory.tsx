import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Download,
  Filter,
  Search,
  DollarSign,
  Calendar,
  Loader2,
  ExternalLink,
  CheckCircle, // ADD THIS IMPORT
  Clock // ADD THIS IMPORT
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { transactionService, Transaction, TransactionStats } from '@/services/transactionService';
import { useNavigate } from 'react-router-dom';
import { exportToPDF } from '@/utils/exportUtils';

const ProducerTransactionHistory = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getProducerTransactions();

      // Show all transactions - payout status will be displayed in the table
      setTransactions(response.transactions || []);
      setStats(response.stats);
    } catch (error: any) {
      console.error('Failed to load transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);

      const filters: any = {};
      if (dateRange.start) {
        filters.startDate = new Date(dateRange.start + "T00:00:00Z").toISOString();
      }
      if (dateRange.end) {
        filters.endDate = new Date(dateRange.end + "T23:59:59Z").toISOString();
      }

      const response = await transactionService.getProducerTransactions(filters);

      // Correctly access nested data
      const resData = response.data.data; // <-- notice the double 'data'
      setTransactions(resData.transactions);
      setStats(resData.stats);

    } catch (error: any) {
      console.error("Filter transactions error:", error);
      toast({
        title: "Error",
        description: "Failed to filter transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };




  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-600';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'failed': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.items.some(item =>
      item.product.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Transaction History" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading transactions...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader
            title="Transaction History"
            description="View your sales history and payout status"
          />

          <main className="flex-1 p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">{stats.totalRevenue || 0} ETB</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed Sales</p>
                      <p className="text-2xl font-bold">{stats.completedSales || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                      <p className="text-2xl font-bold">{stats.pendingSales || 0}</p>
                    </div>
                    <Filter className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by buyer, order ID, or product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                    <Button variant="outline" onClick={handleFilter}>
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" onClick={loadTransactions}>
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportToPDF(transactions, 'Transaction History', stats, 'PRODUCER')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Sales History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Payout</TableHead>
                      <TableHead>Blockchain</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/transaction/${transaction.id}`)} >
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.orderId}</TableCell>
                        <TableCell>{transaction.buyerName || 'Unknown Buyer'}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {transaction.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.product} (x{item.quantity})
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.amount} ETB</TableCell>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(transaction as any).payoutStatus === 'COMPLETED' ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (transaction as any).payoutStatus === 'SCHEDULED' ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          ) : (transaction as any).payoutStatus === 'PROCESSING' ? (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Processing
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.blockchainStatus.verified ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : transaction.blockchainStatus.status === 'pending_verification' ? (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Awaiting
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {transactions.length === 0
                      ? "No sales transactions yet"
                      : "No transactions found for your search"
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProducerTransactionHistory;