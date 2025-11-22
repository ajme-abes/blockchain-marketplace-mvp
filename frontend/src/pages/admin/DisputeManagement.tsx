import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { disputeService, Dispute } from '@/services/disputeService';

const DisputeManagement = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [resolving, setResolving] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const result = await disputeService.getAllDisputes();
      
      if (result.status === 'success' && result.data) {
        setDisputes(result.data.disputes || []);
      } else {
        throw new Error(result.message || 'Failed to fetch disputes');
      }
    } catch (error: any) {
      console.error('Failed to fetch disputes:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (status: string, resolution?: string) => {
    if (!selectedDispute) return;

    try {
      setResolving(true);
      
      const result = await disputeService.updateDisputeStatus(
        selectedDispute.id,
        status,
        resolution || resolutionNote,
        refundAmount ? parseFloat(refundAmount) : undefined
      );

      if (result.status === 'success') {
        toast({
          title: "Dispute Resolved",
          description: `Dispute has been ${status.toLowerCase()}`,
        });
        setSelectedDispute(null);
        setResolutionNote('');
        setRefundAmount('');
        await fetchDisputes(); // Refresh the list
      } else {
        throw new Error(result.message || 'Failed to resolve dispute');
      }
    } catch (error: any) {
      console.error('Failed to resolve dispute:', error);
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve dispute",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedDispute || !refundAmount) return;

    try {
      setRefunding(true);
      
      const result = await disputeService.updateDisputeStatus(
        selectedDispute.id,
        'REFUNDED',
        resolutionNote || 'Refund processed by admin',
        parseFloat(refundAmount)
      );

      if (result.status === 'success') {
        toast({
          title: "Refund Processed",
          description: `Refund of ${refundAmount} ETB processed successfully`,
        });
        setSelectedDispute(null);
        setResolutionNote('');
        setRefundAmount('');
        await fetchDisputes();
      } else {
        throw new Error(result.message || 'Failed to process refund');
      }
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      toast({
        title: "Refund Failed",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setRefunding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-500 text-white';
      case 'UNDER_REVIEW':
        return 'bg-blue-500 text-white';
      case 'RESOLVED':
        return 'bg-green-500 text-white';
      case 'REFUNDED':
        return 'bg-green-500 text-white';
      case 'CANCELLED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (dispute: Dispute) => {
    const daysOpen = Math.floor((new Date().getTime() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOpen > 5) return 'text-red-600 bg-red-500/10 border-red-500/20';
    if (daysOpen > 2) return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
    return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
  };

  const getDaysOpen = (createdAt: string) => {
    return Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.raisedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || dispute.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="Dispute Management" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading disputes...</p>
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
            title="Dispute Management"
            description="Manage and resolve customer disputes"
            action={
              <Button onClick={fetchDisputes} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search disputes by ID, order, reason, or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Disputes Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Disputes ({filteredDisputes.length})
                    </div>
                    <Badge variant="outline">
                      {disputes.filter(d => d.status === 'OPEN').length} Open
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dispute ID</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Raised By</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Days Open</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDisputes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-8">
                              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No disputes found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredDisputes.map((dispute) => (
                            <TableRow key={dispute.id}>
                              <TableCell className="font-mono text-sm">
                                {dispute.id.slice(-8)}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {dispute.orderId.slice(-8)}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{dispute.raisedBy.name}</p>
                                  <p className="text-xs text-muted-foreground">{dispute.raisedBy.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="font-medium">{dispute.reason}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {dispute.description}
                                </p>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {dispute.order?.totalAmount ? `${dispute.order.totalAmount} ETB` : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getPriorityColor(dispute)}>
                                  {getDaysOpen(dispute.createdAt) > 5 ? 'High' : 
                                   getDaysOpen(dispute.createdAt) > 2 ? 'Medium' : 'Low'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={getDaysOpen(dispute.createdAt) > 5 ? 'text-red-600 font-semibold' : ''}>
                                  {getDaysOpen(dispute.createdAt)} days
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(dispute.status)}>
                                  {dispute.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(dispute.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedDispute(dispute)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Dispute Resolution - {selectedDispute?.id.slice(-8)}
            </DialogTitle>
            <DialogDescription>
              Order: {selectedDispute?.orderId.slice(-8)} - {selectedDispute?.reason}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Dispute Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Raised By</p>
                  <p className="text-sm">{selectedDispute.raisedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDispute.raisedBy.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Order Amount</p>
                  <p className="text-sm font-semibold">
                    {selectedDispute.order?.totalAmount ? `${selectedDispute.order.totalAmount} ETB` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Status</p>
                  <Badge className={getStatusColor(selectedDispute.status)}>
                    {selectedDispute.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold">Days Open</p>
                  <p className="text-sm">{getDaysOpen(selectedDispute.createdAt)} days</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-semibold mb-2">Description</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedDispute.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-semibold">{selectedDispute.evidenceCount}</p>
                  <p className="text-xs text-muted-foreground">Evidence Files</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-semibold">{selectedDispute.messageCount}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-semibold">
                    {selectedDispute.refundAmount ? `${selectedDispute.refundAmount} ETB` : 'None'}
                  </p>
                  <p className="text-xs text-muted-foreground">Refund Amount</p>
                </div>
              </div>

              {/* Resolution Notes */}
              <div>
                <p className="text-sm font-semibold mb-2">Resolution Notes</p>
                <Textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Enter resolution details and reasoning..."
                  rows={4}
                />
              </div>

              {/* Refund Section */}
              {selectedDispute.status !== 'REFUNDED' && (
                <div>
                  <p className="text-sm font-semibold mb-2">Refund Processing</p>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Refund amount (ETB)"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      onClick={handleRefund}
                      disabled={refunding || !refundAmount || !resolutionNote.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {refunding ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <DollarSign className="h-4 w-4 mr-2" />
                      )}
                      Process Refund
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <DialogFooter className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleResolveDispute('RESOLVED')}
                  disabled={resolving || !resolutionNote.trim()}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleResolveDispute('UNDER_REVIEW')}
                  disabled={resolving || !resolutionNote.trim()}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mark Under Review
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleResolveDispute('CANCELLED')}
                  disabled={resolving || !resolutionNote.trim()}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Dispute
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open(`/disputes/${selectedDispute.id}`, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default DisputeManagement;