// src/pages/admin/DisputeManagement.tsx - FIXED NAVIGATION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle, 
  Eye, 
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  FileText,
  Shield,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { disputeService, Dispute } from '@/services/disputeService';

const DisputeManagement = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    recent: 0,
    resolutionRate: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
    fetchStats();
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

  const fetchStats = async () => {
    try {
      const result = await disputeService.getDisputeStats();
      if (result.status === 'success' && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchDisputes(), fetchStats()]);
    toast({
      title: "Refreshed",
      description: "Dispute data updated",
    });
  };

  // REMOVED: All dialog-related state and functions
  // REMOVED: selectedDispute, resolutionNote, refundAmount, resolving, refunding
  // REMOVED: handleResolveDispute, handleRefund functions

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
            description="Manage and resolve customer disputes with advanced intervention tools"
            action={
              <div className="flex gap-2">
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            }
          />

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Total Disputes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
                    <p className="text-xs text-muted-foreground">Open</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
                    <p className="text-xs text-muted-foreground">Under Review</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.recent}</div>
                    <p className="text-xs text-muted-foreground">Last 7 Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-indigo-600">
                      {stats.resolutionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Resolution Rate</p>
                  </CardContent>
                </Card>
              </div>

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
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                        {disputes.filter(d => d.status === 'OPEN').length} Open
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700">
                        {disputes.filter(d => d.status === 'UNDER_REVIEW').length} In Review
                      </Badge>
                    </div>
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
                          <TableHead>Evidence</TableHead>
                          <TableHead>Messages</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDisputes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-8">
                              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No disputes found</p>
                              {statusFilter !== 'ALL' && (
                                <Button 
                                  variant="outline" 
                                  onClick={() => setStatusFilter('ALL')}
                                  className="mt-2"
                                >
                                  View All Disputes
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredDisputes.map((dispute) => (
                            <TableRow key={dispute.id} className="hover:bg-muted/50">
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
                                <span className={
                                  getDaysOpen(dispute.createdAt) > 5 
                                    ? 'text-red-600 font-semibold' 
                                    : getDaysOpen(dispute.createdAt) > 2 
                                    ? 'text-yellow-600 font-semibold' 
                                    : 'text-green-600 font-semibold'
                                }>
                                  {getDaysOpen(dispute.createdAt)} days
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{dispute.evidenceCount}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{dispute.messageCount}</span>
                                </div>
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
                                <div className="flex justify-end gap-1">
                                  {/* Main View Button - Goes to Admin Dispute Detail */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
                                    title="View detailed dispute"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {/* Quick Chat Access */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/disputes/${dispute.id}?tab=chat`)}
                                    title="Join conversation"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  {/* Quick Evidence Access */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/disputes/${dispute.id}?tab=evidence`)}
                                    title="Review evidence"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common administrative tasks for dispute management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const highPriority = disputes.filter(d => 
                          getDaysOpen(d.createdAt) > 5 && d.status === 'OPEN'
                        );
                        if (highPriority.length > 0) {
                          navigate(`/admin/disputes/${highPriority[0].id}`);
                        } else {
                          toast({
                            title: "No High Priority",
                            description: "No disputes require immediate attention",
                          });
                        }
                      }}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Handle High Priority
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const needsReview = disputes.filter(d => d.status === 'UNDER_REVIEW');
                        if (needsReview.length > 0) {
                          navigate(`/admin/disputes/${needsReview[0].id}`);
                        } else {
                          toast({
                            title: "No Reviews Needed",
                            description: "No disputes are currently under review",
                          });
                        }
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Review Pending Cases
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const oldestOpen = disputes
                          .filter(d => d.status === 'OPEN')
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                        if (oldestOpen.length > 0) {
                          navigate(`/admin/disputes/${oldestOpen[0].id}`);
                        } else {
                          toast({
                            title: "No Open Disputes",
                            description: "All disputes have been addressed",
                          });
                        }
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Address Oldest Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* REMOVED: Entire Dialog component since we're using navigation now */}
    </SidebarProvider>
  );
};

export default DisputeManagement;