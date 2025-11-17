import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription // ADD THIS IMPORT
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2,
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { transactionService } from '@/services/transactionService';

const TransactionDetail = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<any>(null);
  const [blockchainDetails, setBlockchainDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (transactionId) {
      loadTransactionDetails();
    }
  }, [transactionId]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      
      // Get transactions based on user role
      const response = user?.role === 'PRODUCER' 
        ? await transactionService.getProducerTransactions()
        : await transactionService.getBuyerTransactions();
      
      const foundTransaction = response.transactions.find(
        (t: any) => t.id === transactionId || t.orderId === transactionId
      );
      
      if (foundTransaction) {
        setTransaction(foundTransaction);
        
        // Load blockchain details if available
        if (foundTransaction.blockchainTxHash) {
          loadBlockchainDetails(foundTransaction.blockchainTxHash);
        }
      } else {
        toast({
          title: "Error",
          description: "Transaction not found",
          variant: "destructive",
        });
        navigate(-1);
      }
    } catch (error: any) {
      console.error('Failed to load transaction details:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBlockchainDetails = async (txHash: string) => {
    try {
      setBlockchainLoading(true);
      
      // In a real implementation, you would call your backend to verify the transaction
      // For now, we'll simulate it
      setTimeout(() => {
        setBlockchainDetails({
          txHash,
          status: 'confirmed',
          blockNumber: '12345678',
          timestamp: new Date().toISOString(),
          confirmations: 12,
          gasUsed: '21000',
          explorerUrl: `https://amoy.polygonscan.com/tx/${txHash}`
        });
        setBlockchainLoading(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to load blockchain details:', error);
      setBlockchainLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const openInExplorer = (txHash: string) => {
    window.open(`https://amoy.polygonscan.com/tx/${txHash}`, '_blank');
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Transaction Details" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading transaction details...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!transaction) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <PageHeader 
            title="Transaction Details" 
            description="View detailed information about this transaction"
          />

          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Back Button */}
              <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transactions
              </Button>

              {/* Transaction Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Transaction ID
                      </label>
                      <p className="font-medium">{transaction.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Order ID
                      </label>
                      <p className="font-medium">{transaction.orderId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {user?.role === 'PRODUCER' ? 'Buyer' : 'Seller'}
                      </label>
                      <p className="font-medium">
                        {transaction.buyerName || transaction.items[0]?.producer || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Amount
                      </label>
                      <p className="font-medium text-primary">{transaction.amount} ETB</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Date
                      </label>
                      <p className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()} at{' '}
                        {new Date(transaction.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <Badge className={
                        transaction.status === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                        transaction.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }>
                        {transaction.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {user?.role === 'PRODUCER' ? 'Sold Items' : 'Purchased Items'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transaction.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.product}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × {item.price} ETB
                          </p>
                          {item.producer && (
                            <p className="text-sm text-muted-foreground">
                              Producer: {item.producer}
                            </p>
                          )}
                        </div>
                        <p className="font-medium">{item.subtotal || (item.quantity * item.price)} ETB</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Blockchain Verification */}
{transaction.blockchainTxHash ? (
    <Card>
    <CardHeader>
  <CardTitle className="flex items-center gap-2">
    <Shield className="h-5 w-5" />
    Blockchain Verification
    <Badge variant="outline" className="bg-green-500/10 text-green-600">
      Verified
    </Badge>
  </CardTitle>
  <div className="text-sm text-muted-foreground"> {/* ← REPLACEMENT */}
    Transaction recorded on Polygon Amoy
  </div>
</CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Verified on Blockchain</span>
        </div>
        <div className="text-xs bg-muted p-2 rounded break-all">
          {transaction.blockchainTxHash}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => window.open(`https://amoy.polygonscan.com/tx/${transaction.blockchainTxHash}`, '_blank')}
        >
          <ExternalLink className="h-3 w-3 mr-2" />
          View on Polygonscan
        </Button>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-yellow-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Pending blockchain verification</span>
        </div>
      </CardContent>
    </Card>
  )}
  

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Payment Method
                      </label>
                      <p className="font-medium">{transaction.paymentMethod || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Payment Confirmed
                      </label>
                      <p className="font-medium">
                        {transaction.confirmedAt 
                          ? new Date(transaction.confirmedAt).toLocaleString()
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TransactionDetail;