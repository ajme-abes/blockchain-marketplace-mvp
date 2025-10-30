import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, Eye, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockDisputes = [
  { 
    id: 'D001',
    orderId: 'ORD-1234',
    buyer: 'Sara Mohammed',
    producer: 'Alemayehu Bekele',
    product: 'Premium Yirgacheffe Coffee',
    amount: 22500,
    status: 'open',
    priority: 'high',
    created: '2024-01-15',
    daysOpen: 3
  },
  { 
    id: 'D002',
    orderId: 'ORD-1235',
    buyer: 'Dawit Tesfaye',
    producer: 'Tigist Haile',
    product: 'Organic White Teff',
    amount: 5400,
    status: 'investigating',
    priority: 'medium',
    created: '2024-01-16',
    daysOpen: 2
  },
  { 
    id: 'D003',
    orderId: 'ORD-1236',
    buyer: 'Mekdes Alemu',
    producer: 'Yonas Gebre',
    product: 'Hulled Sesame Seeds',
    amount: 8400,
    status: 'open',
    priority: 'low',
    created: '2024-01-17',
    daysOpen: 1
  }
];

const DisputeManagement = () => {
  const [selectedDispute, setSelectedDispute] = useState<typeof mockDisputes[0] | null>(null);
  const [resolution, setResolution] = useState('');
  const { toast } = useToast();

  const handleResolve = (action: string) => {
    toast({
      title: 'Dispute Resolved',
      description: `Dispute has been resolved with action: ${action}`,
    });
    setSelectedDispute(null);
    setResolution('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
      default: return '';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border flex items-center px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-xl font-bold ml-4">Dispute Management</h1>
          </header>

          <main className="flex-1 p-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Open Disputes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dispute ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Producer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Amount (ETB)</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Days Open</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDisputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell className="font-mono">{dispute.id}</TableCell>
                          <TableCell className="font-mono">{dispute.orderId}</TableCell>
                          <TableCell>{dispute.buyer}</TableCell>
                          <TableCell>{dispute.producer}</TableCell>
                          <TableCell>{dispute.product}</TableCell>
                          <TableCell>{dispute.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getPriorityColor(dispute.priority)}>
                              {dispute.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={dispute.daysOpen > 2 ? 'text-red-600 font-semibold' : ''}>
                              {dispute.daysOpen} days
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={dispute.status === 'open' ? 'destructive' : 'secondary'}>
                              {dispute.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedDispute(dispute)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Dispute Details - {dispute.id}</DialogTitle>
                                  <DialogDescription>
                                    Review and resolve this dispute
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-semibold">Order ID</p>
                                      <p className="text-sm text-muted-foreground">{dispute.orderId}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold">Amount</p>
                                      <p className="text-sm text-muted-foreground">{dispute.amount} ETB</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold">Buyer</p>
                                      <p className="text-sm text-muted-foreground">{dispute.buyer}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold">Producer</p>
                                      <p className="text-sm text-muted-foreground">{dispute.producer}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm font-semibold mb-2">Resolution Notes</p>
                                    <Textarea
                                      value={resolution}
                                      onChange={(e) => setResolution(e.target.value)}
                                      placeholder="Enter resolution details and reasoning..."
                                      rows={4}
                                    />
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="default"
                                      onClick={() => handleResolve('Refund Buyer')}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Refund Buyer
                                    </Button>
                                    <Button
                                      variant="default"
                                      onClick={() => handleResolve('Release to Producer')}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Release to Producer
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleResolve('Partial Refund')}
                                    >
                                      Partial Refund
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleResolve('Request More Info')}
                                    >
                                      Request More Info
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DisputeManagement;