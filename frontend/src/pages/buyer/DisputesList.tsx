// src/pages/buyer/DisputesList.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  FileText
} from 'lucide-react';
import { disputeService, Dispute } from '@/services/disputeService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DisputesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBuyer = user?.role === 'BUYER';
  const isProducer = user?.role === 'PRODUCER';
  const pageTitle = isProducer ? "Store Disputes" : "My Disputes";
  const pageDescription = isProducer 
    ? "Manage disputes related to your products and orders" 
    : "Manage and track your dispute cases";

  const { toast } = useToast();
  
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const statusFilters = [
    { value: 'ALL', label: 'All Disputes' },
    { value: 'OPEN', label: 'Open' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' }
  ];

  useEffect(() => {
    fetchDisputes();
  }, []);

 const fetchDisputes = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (statusFilter !== 'ALL') {
        filters.status = statusFilter;
      }
      
      const result = await disputeService.getUserDisputes(filters);
      
      if (result.status === 'success' && result.data) {
        setDisputes(result.data.disputes);
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
 
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDisputes();
    setRefreshing(false);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    // Refetch with new filter
    setTimeout(() => fetchDisputes(), 100);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertTriangle className="h-3 w-3" />;
      case 'UNDER_REVIEW':
        return <Clock className="h-3 w-3" />;
      case 'RESOLVED':
        return <CheckCircle className="h-3 w-3" />;
      case 'REFUNDED':
        return <CheckCircle className="h-3 w-3" />;
      case 'CANCELLED':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredDisputes = disputes.filter(dispute => 
    dispute.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dispute.order?.buyer?.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <PageHeader title="My Disputes" />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading your disputes...</p>
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
            title={pageTitle}
            description={pageDescription}
            action={
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Filter className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            }
          />

          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Filters and Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search disputes by order ID, reason, or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                      {statusFilters.map(filter => (
                        <Button
                          key={filter.value}
                          variant={statusFilter === filter.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStatusFilterChange(filter.value)}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disputes List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      Disputes ({filteredDisputes.length})
                      {statusFilter !== 'ALL' && ` - ${statusFilters.find(f => f.value === statusFilter)?.label}`}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredDisputes.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No disputes found</h3>
                      <p className="text-muted-foreground mb-4">
                        {statusFilter === 'ALL' 
                          ? "You haven't raised any disputes yet."
                          : `No ${statusFilter.toLowerCase().replace('_', ' ')} disputes found.`
                        }
                      </p>
                      {statusFilter !== 'ALL' && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleStatusFilterChange('ALL')}
                        >
                          View All Disputes
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDisputes.map(dispute => (
                        <div
                          key={dispute.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/disputes/${dispute.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={getStatusColor(dispute.status)}>
                                  {getStatusIcon(dispute.status)}
                                  <span className="ml-1">{dispute.status.replace('_', ' ')}</span>
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Order: #{dispute.orderId.slice(-8)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(dispute.createdAt)}
                                </span>
                              </div>
                              
                              <h3 className="font-semibold text-lg mb-1">
                                {dispute.reason}
                              </h3>
                              
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {dispute.description}
                              </p>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span>{dispute.evidenceCount} evidence files</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{dispute.messageCount} messages</span>
                                </div>
                                {dispute.refundAmount && (
                                  <div className="text-green-600 font-medium">
                                    Refund: {dispute.refundAmount} ETB
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/disputes/${dispute.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                          
                          {/* Latest message preview */}
                          {dispute.latestMessage && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">{dispute.latestMessage.senderName}:</span>{' '}
                                {dispute.latestMessage.content}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DisputesList;